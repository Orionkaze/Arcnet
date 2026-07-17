import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/notifications
 * Returns the current user's notifications (newest first), enriched with the
 * sending user's public profile info and, where relevant, the target post.
 *
 * The Notification model stores only fromUserId/postId as plain strings (no
 * Prisma relations), so we resolve those in batch here.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId as string;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (notifications.length === 0) {
      return NextResponse.json({ notifications: [] }, { status: 200 });
    }

    // Batch-resolve senders and posts referenced by these notifications.
    const fromUserIds = [...new Set(notifications.map((n) => n.fromUserId))];
    const postIds = [
      ...new Set(
        notifications.map((n) => n.postId).filter((id): id is string => Boolean(id))
      ),
    ];

    const [fromUsers, posts] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: fromUserIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          avatar: true,
          role: true,
        },
      }),
      postIds.length
        ? prisma.post.findMany({
            where: { id: { in: postIds } },
            select: { id: true, content: true },
          })
        : Promise.resolve([]),
    ]);

    const userMap = new Map(fromUsers.map((u) => [u.id, u]));
    const postMap = new Map(posts.map((p) => [p.id, p]));

    const enriched = notifications.map((n) => {
      const fromUser = userMap.get(n.fromUserId) || null;
      const post = n.postId ? postMap.get(n.postId) || null : null;
      return {
        id: n.id,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
        fromUser,
        post: post
          ? {
              id: post.id,
              excerpt:
                post.content && post.content.length > 90
                  ? `${post.content.slice(0, 90)}…`
                  : post.content || "",
            }
          : null,
      };
    });

    return NextResponse.json({ notifications: enriched }, { status: 200 });
  } catch (error) {
    console.error("GET Notifications Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

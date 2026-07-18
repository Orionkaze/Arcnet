import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const userId = session.userId as string;

    // Rate limit: 60 repost toggles per minute per user.
    const rateLimit = await checkRateLimit(`repost_toggle_${userId}`, 60, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const existingRepost = await prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingRepost) {
      await prisma.repost.delete({
        where: { id: existingRepost.id },
      });
    } else {
      await prisma.repost.create({
        data: {
          userId,
          postId,
        },
      });

      // Best-effort notification; must never break the repost action.
      try {
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { authorId: true },
        });
        if (post && post.authorId !== userId) {
          await prisma.notification.create({
            data: {
              type: "repost",
              userId: post.authorId,
              fromUserId: userId,
              postId,
            },
          });
        }
      } catch (notifyError) {
        console.error("Repost Notification Error:", notifyError);
      }
    }

    const repostsCount = await prisma.repost.count({
      where: { postId },
    });

    return NextResponse.json({ 
      isReposted: !existingRepost, 
      repostsCount 
    }, { status: 200 });

  } catch (error) {
    console.error("Toggle Repost Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

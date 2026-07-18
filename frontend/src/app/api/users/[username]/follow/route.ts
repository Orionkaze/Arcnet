import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await params;
    const followerId = session.userId as string;

    // Rate limit: 60 follow toggles per minute per user.
    const rateLimit = await checkRateLimit(`follow_toggle_${followerId}`, 60, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const cleanUsername = decodeURIComponent(username).replace(/^@/, "");

    const targetUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: cleanUsername,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const followingId = targetUser.id;

    if (followerId === followingId) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    let following = false;
    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      following = false;
    } else {
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });
      following = true;

      // Best-effort notification; must never break the follow action.
      try {
        await prisma.notification.create({
          data: {
            type: "follow",
            userId: followingId,
            fromUserId: followerId,
          },
        });
      } catch (notifyError) {
        console.error("Follow Notification Error:", notifyError);
      }
    }

    const followerCount = await prisma.follow.count({
      where: { followingId },
    });

    return NextResponse.json({ following, followerCount }, { status: 200 });
  } catch (error) {
    console.error("Toggle Follow Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

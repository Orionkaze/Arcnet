import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: followingId } = await params;
    const followerId = session.userId as string;

    // Rate limit: 60 follow toggles per minute per user.
    const rateLimit = await checkRateLimit(`follow_toggle_${followerId}`, 60, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    if (followerId === followingId) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    // Verify the target exists, otherwise follow.create throws an opaque FK 500.
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
    } else {
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // Best-effort notification; must never break the follow action
      // (mirrors the username-based follow route).
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

    return NextResponse.json({
      isFollowing: !existingFollow
    }, { status: 200 });

  } catch (error) {
    console.error("Toggle Follow Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

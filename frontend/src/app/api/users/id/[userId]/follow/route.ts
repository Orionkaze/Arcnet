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
    }

    return NextResponse.json({ 
      isFollowing: !existingFollow 
    }, { status: 200 });

  } catch (error) {
    console.error("Toggle Follow Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

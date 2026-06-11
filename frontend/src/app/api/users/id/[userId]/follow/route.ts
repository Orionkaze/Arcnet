import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

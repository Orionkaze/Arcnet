import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    let liked = false;
    if (existingLike) {
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      liked = false;
    } else {
      await prisma.like.create({
        data: {
          userId,
          postId,
        },
      });
      liked = true;
    }

    const likeCount = await prisma.like.count({
      where: { postId },
    });

    return NextResponse.json({ liked, likeCount }, { status: 200 });
  } catch (error) {
    console.error("Toggle Like Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

    const existingRepost = await prisma.repost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    let reposted = false;
    if (existingRepost) {
      await prisma.repost.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      reposted = false;
    } else {
      await prisma.repost.create({
        data: {
          userId,
          postId,
        },
      });
      reposted = true;
    }

    const repostCount = await prisma.repost.count({
      where: { postId },
    });

    return NextResponse.json({ reposted, repostCount }, { status: 200 });
  } catch (error) {
    console.error("Toggle Repost Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

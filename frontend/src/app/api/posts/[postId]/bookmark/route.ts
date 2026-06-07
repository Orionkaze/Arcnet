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

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    let bookmarked = false;
    if (existingBookmark) {
      await prisma.bookmark.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      bookmarked = false;
    } else {
      await prisma.bookmark.create({
        data: {
          userId,
          postId,
        },
      });
      bookmarked = true;
    }

    const bookmarkCount = await prisma.bookmark.count({
      where: { postId },
    });

    return NextResponse.json({ bookmarked, bookmarkCount }, { status: 200 });
  } catch (error) {
    console.error("Toggle Bookmark Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

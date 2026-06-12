import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const userId = session.userId as string;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden: You can only delete your own posts" }, { status: 403 });
    }

    // Delete related records manually since onDelete: Cascade might not be set
    await prisma.$transaction([
      prisma.like.deleteMany({ where: { postId: postId } }),
      prisma.comment.deleteMany({ where: { postId: postId } }),
      prisma.repost.deleteMany({ where: { postId: postId } }),
      prisma.bookmark.deleteMany({ where: { postId: postId } }),
      prisma.post.delete({ where: { id: postId } }),
    ]);

    return NextResponse.json({ success: true, message: "Post deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete Post Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

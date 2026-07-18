import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
    });

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error("Fetch Comments Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

    // Rate limit: 60 comments per minute per user.
    const rateLimit = checkRateLimit(`comment_create_${userId}`, 60, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "You're commenting too fast. Please slow down." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json({ error: "Content cannot be empty" }, { status: 400 });
    }

    if (content.trim().length > 1000) {
      return NextResponse.json({ error: "Comment cannot exceed 1000 characters" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId,
        postId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
    });

    const commentsCount = await prisma.comment.count({
      where: { postId },
    });

    // Best-effort notification; must never break the comment action.
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });
      if (post && post.authorId !== userId) {
        await prisma.notification.create({
          data: {
            type: "comment",
            userId: post.authorId,
            fromUserId: userId,
            postId,
          },
        });
      }
    } catch (notifyError) {
      console.error("Comment Notification Error:", notifyError);
    }

    return NextResponse.json({ comment, commentsCount }, { status: 201 });
  } catch (error) {
    console.error("Create Comment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

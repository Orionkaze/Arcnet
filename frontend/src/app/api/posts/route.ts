import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId as string;

    // Rate Limit: 10 posts per hour
    const limitKey = `post_creation:${userId}`;
    const rateLimitRes = checkRateLimit(limitKey, 10, 60 * 60 * 1000);
    if (!rateLimitRes.success) {
      return NextResponse.json(
        { error: "You're posting too fast. Please wait before posting again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { content, imageUrl, hubId } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json({ error: "Content cannot be empty" }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: "Content cannot exceed 500 characters" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        imageUrl: imageUrl || null,
        authorId: userId,
        hubId: hubId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        likes: true,
        comments: true,
        reposts: true,
        bookmarks: true,
        hub: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });

    // Standardize structure for frontend
    const formattedPost = {
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      repostsCount: post.reposts.length,
      bookmarksCount: post.bookmarks.length,
      isLiked: false,
      isBookmarked: false,
      isReposted: false,
      isFollowing: false,
    };

    return NextResponse.json({ post: formattedPost }, { status: 201 });
  } catch (error) {
    console.error("Create Post Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

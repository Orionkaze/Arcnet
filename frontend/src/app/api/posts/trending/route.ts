import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const userId = session?.userId as string | undefined;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (page < 1 || limit < 1) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }

    // Fetch posts globally
    const rawPosts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 300, // Process top 300 posts
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
        comments: {
          select: { id: true },
        },
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

    const scoredPosts = rawPosts.map((post) => {
      const likesCount = post.likes.length;
      const commentsCount = post.comments.length;
      const repostsCount = post.reposts.length;
      const bookmarksCount = post.bookmarks.length;

      // Pure engagement score (no recency decay)
      const rawScore =
        likesCount * 2 + commentsCount * 3 + repostsCount * 1.5 + bookmarksCount * 1;

      return {
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author,
        hub: post.hub,
        likesCount,
        commentsCount,
        repostsCount,
        bookmarksCount,
        isLiked: userId ? post.likes.some((l) => l.userId === userId) : false,
        isBookmarked: userId ? post.bookmarks.some((b) => b.userId === userId) : false,
        isReposted: userId ? post.reposts.some((r) => r.userId === userId) : false,
        isFollowing: false, // Default will update below if authenticated
        engagementScore: rawScore,
      };
    });

    // Populate isFollowing flags if logged in
    if (userId && scoredPosts.length > 0) {
      const authorIds = scoredPosts.map((p) => p.author.id);
      const userFollows = await prisma.follow.findMany({
        where: {
          followerId: userId,
          followingId: { in: authorIds },
        },
        select: { followingId: true },
      });
      const followedIdsSet = new Set(userFollows.map((f) => f.followingId));
      scoredPosts.forEach((post) => {
        post.isFollowing = followedIdsSet.has(post.author.id);
      });
    }

    // Sort by engagementScore desc, then by createdAt desc
    scoredPosts.sort((a, b) => {
      if (b.engagementScore !== a.engagementScore) {
        return b.engagementScore - a.engagementScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Slice for pagination
    const startIndex = (page - 1) * limit;
    const paginatedPosts = scoredPosts.slice(startIndex, startIndex + limit);
    const hasMore = scoredPosts.length > startIndex + limit;

    return NextResponse.json(
      { posts: paginatedPosts, hasMore },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch Trending Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

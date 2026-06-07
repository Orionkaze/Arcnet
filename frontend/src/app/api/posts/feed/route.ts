import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId as string;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (page < 1 || limit < 1) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }

    // Get list of users the logged-in user follows
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followedIds = follows.map((f) => f.followingId);

    // Get list of hubs the logged-in user has joined
    const joinedHubMemberships = await prisma.hubMember.findMany({
      where: { userId },
      select: { hubId: true },
    });

    const joinedHubIds = joinedHubMemberships.map((jh) => jh.hubId);

    if (followedIds.length === 0 && joinedHubIds.length === 0) {
      return NextResponse.json({ posts: [], hasMore: false }, { status: 200 });
    }

    // Fetch posts from followed creators or joined hubs
    // We order by createdAt desc and take a reasonable batch to calculate feed rankings in JS.
    const rawPosts = await prisma.post.findMany({
      where: {
        OR: [
          { authorId: { in: followedIds } },
          { hubId: { in: joinedHubIds } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 200, // Process top 200 recent posts
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

    const now = new Date();
    const scoredPosts = rawPosts.map((post) => {
      const likesCount = post.likes.length;
      const commentsCount = post.comments.length;
      const repostsCount = post.reposts.length;
      const bookmarksCount = post.bookmarks.length;

      const rawScore =
        likesCount * 2 + commentsCount * 3 + repostsCount * 1.5 + bookmarksCount * 1;

      // Recency decay logic
      const ageInHours = (now.getTime() - post.createdAt.getTime()) / (1000 * 60 * 60);
      let finalScore = rawScore;
      if (ageInHours > 48) {
        const decayHours = ageInHours - 48;
        // Rational decay: decays score smoothly and bounds multiplier to >= 0.1
        const multiplier = Math.max(0.1, 1 / (1 + 0.02 * decayHours));
        finalScore = rawScore * multiplier;
      }

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
        isLiked: post.likes.some((l) => l.userId === userId),
        isBookmarked: post.bookmarks.some((b) => b.userId === userId),
        isReposted: post.reposts.some((r) => r.userId === userId),
        isFollowing: followedIds.includes(post.author.id),
        engagementScore: finalScore,
      };
    });

    // Sort scored posts by engagementScore descending, then by createdAt descending
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
    console.error("Fetch Feed Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

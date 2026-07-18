import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    const userId = session?.userId as string | undefined;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (page < 1 || limit < 1) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }

    const hub = await prisma.hub.findUnique({
      where: { slug },
    });

    if (!hub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    if (hub.isPrivate) {
      if (!session?.userId) {
        return NextResponse.json({ error: "This is a private hub." }, { status: 403 });
      }
      const membership = await prisma.hubMember.findUnique({
        where: {
          hubId_userId: {
            hubId: hub.id,
            userId: session.userId as string,
          },
        },
      });
      if (!membership) {
        return NextResponse.json({ error: "This is a private hub." }, { status: 403 });
      }
    }

    // Fetch posts tagged with this hub
    const rawPosts = await prisma.post.findMany({
      where: { hubId: hub.id },
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
        isLiked: userId ? post.likes.some((l) => l.userId === userId) : false,
        isBookmarked: userId ? post.bookmarks.some((b) => b.userId === userId) : false,
        isReposted: userId ? post.reposts.some((r) => r.userId === userId) : false,
        isFollowing: false, // will update below
        engagementScore: finalScore,
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

    return NextResponse.json({ posts: paginatedPosts, hasMore });
  } catch (error) {
    console.error("GET /api/hubs/[slug]/posts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

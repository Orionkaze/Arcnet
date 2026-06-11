import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    if (!username) {
      return NextResponse.json({ error: "Username parameter is required" }, { status: 400 });
    }

    const cleanUsername = decodeURIComponent(username).replace(/^@/, "");

    const targetUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: cleanUsername,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const posts = await prisma.post.findMany({
      where: { authorId: targetUser.id },
      orderBy: { createdAt: "desc" },
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

    const session = await getSession();
    const currentUserId = session?.userId as string | undefined;

    let followingIds = new Set<string>();
    if (currentUserId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      follows.forEach((f) => followingIds.add(f.followingId));
    }

    const formattedPosts = posts.map((post) => {
      let isLiked = false;
      let isBookmarked = false;
      let isReposted = false;
      let isFollowing = false;

      if (currentUserId) {
        isLiked = post.likes.some((l) => l.userId === currentUserId);
        isBookmarked = post.bookmarks.some((b) => b.userId === currentUserId);
        isReposted = post.reposts.some((r) => r.userId === currentUserId);
        isFollowing = followingIds.has(post.authorId);
      }

      return {
        ...post,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        repostsCount: post.reposts.length,
        bookmarksCount: post.bookmarks.length,
        isLiked,
        isBookmarked,
        isReposted,
        isFollowing,
      };
    });

    return NextResponse.json({ posts: formattedPosts }, { status: 200 });
  } catch (error) {
    console.error("Fetch User Posts Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

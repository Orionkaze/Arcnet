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

    const following = await prisma.follow.findMany({
      where: { followerId: targetUser.id },
      include: {
        following: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            isVerified: true,
            bio: true,
          },
        },
      },
    });

    const session = await getSession();
    const currentUserId = session?.userId as string | undefined;

    let currentUserFollowingIds = new Set<string>();
    if (currentUserId) {
      const currentFollows = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      currentFollows.forEach((f) => currentUserFollowingIds.add(f.followingId));
    }

    const formattedFollowing = following.map((f) => ({
      ...f.following,
      isFollowing: currentUserId ? currentUserFollowingIds.has(f.following.id) : false,
    }));

    return NextResponse.json({ users: formattedFollowing }, { status: 200 });
  } catch (error) {
    console.error("Fetch Following Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

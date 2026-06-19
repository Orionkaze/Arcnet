import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const userId = session?.userId as string | undefined;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // Fetch other users
    const users = await prisma.user.findMany({
      where: {
        AND: [
          userId ? { id: { not: userId } } : {},
          { isOnboarded: true },
          { username: { not: null } },
          search
            ? {
                OR: [
                  { username: { contains: search, mode: "insensitive" } },
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { skills: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatar: true,
        role: true,
        skills: true,
      },
      take: 50,
    });

    let followedIdsSet = new Set<string>();
    if (userId) {
      const userFollows = await prisma.follow.findMany({
        where: {
          followerId: userId,
        },
        select: { followingId: true },
      });
      followedIdsSet = new Set(userFollows.map((f) => f.followingId));
    }

    const formattedUsers = users.map((u) => ({
      ...u,
      isFollowing: followedIdsSet.has(u.id),
    }));

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

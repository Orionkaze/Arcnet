import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId as string;

    // Fetch the users that the current user is following (i.e. followerId is current user)
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const followedUsers = follows.map((f) => ({
      id: f.following.id,
      firstName: f.following.firstName,
      lastName: f.following.lastName,
      username: f.following.username,
      avatar: f.following.avatar,
    }));

    return NextResponse.json({ followers: followedUsers }, { status: 200 });
  } catch (error) {
    console.error("GET Followers Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

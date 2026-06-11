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

    // Strip leading '@' if present
    const cleanUsername = decodeURIComponent(username).replace(/^@/, "");

    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: cleanUsername,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatar: true,
        cover: true,
        isVerified: true,
        createdAt: true,
        bio: true,
        role: true,
        location: true,
        skills: true,
        socialLinks: true,
        experience: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
            hubMembers: true,
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let isFollowed = false;
    const session = await getSession();
    if (session && session.userId) {
      const followRecord = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.userId as string,
            followingId: user.id,
          }
        }
      });
      isFollowed = !!followRecord;
    }

    return NextResponse.json({ user, isFollowed }, { status: 200 });
  } catch (error) {
    console.error("Fetch User Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        avatar: true,
        cover: true,
        isVerified: true,
        isOnboarded: true,
        bio: true,
        role: true,
        location: true,
        skills: true,
        socialLinks: true,
      },
    });

    if (!user) {
      const response = NextResponse.json({ error: "User not found" }, { status: 404 });
      response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
      response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
      return response;
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Get Me Error:", error);
    const response = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    // Also clear cookies on internal error as a safety fallback
    response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
    response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
    return response;
  }
}

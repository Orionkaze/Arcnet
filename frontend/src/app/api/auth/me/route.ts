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
        isVerified: true,
        isOnboarded: true,
      },
    });

    if (!user) {
      const response = NextResponse.json({ error: "User not found" }, { status: 404 });
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Get Me Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

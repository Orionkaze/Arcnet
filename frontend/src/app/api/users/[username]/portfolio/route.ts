import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const portfolioProjects = await prisma.portfolioProject.findMany({
      where: { userId: targetUser.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects: portfolioProjects }, { status: 200 });
  } catch (error) {
    console.error("Fetch Portfolio Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

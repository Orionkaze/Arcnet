import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Ownership check: only the owner may add projects to their portfolio.
    if (targetUser.id !== (session.userId as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, tags, link } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (title.length > 150) {
      return NextResponse.json({ error: "Title cannot exceed 150 characters" }, { status: 400 });
    }
    if (description.length > 2000) {
      return NextResponse.json({ error: "Description cannot exceed 2000 characters" }, { status: 400 });
    }
    if (link !== undefined && link !== null && typeof link !== "string") {
      return NextResponse.json({ error: "Invalid link" }, { status: 400 });
    }
    if (typeof link === "string" && link.length > 500) {
      return NextResponse.json({ error: "Link is too long" }, { status: 400 });
    }

    // Normalize tags to a string array (accepts array or comma-separated string).
    let normalizedTags: string[] = [];
    if (Array.isArray(tags)) {
      normalizedTags = tags
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter((t) => t.length > 0);
    } else if (typeof tags === "string") {
      normalizedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }

    const project = await prisma.portfolioProject.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        tags: normalizedTags,
        link: typeof link === "string" && link.trim() ? link.trim() : null,
        userId: session.userId as string,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Add Portfolio Project Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

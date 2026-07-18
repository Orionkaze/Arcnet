import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const userId = session.userId as string;

    // Rate limit: 60 bookmark toggles per minute per user.
    const rateLimit = checkRateLimit(`bookmark_toggle_${userId}`, 60, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingBookmark) {
      await prisma.bookmark.delete({
        where: { id: existingBookmark.id },
      });
    } else {
      await prisma.bookmark.create({
        data: {
          userId,
          postId,
        },
      });
    }

    const bookmarksCount = await prisma.bookmark.count({
      where: { postId },
    });

    return NextResponse.json({ 
      isBookmarked: !existingBookmark, 
      bookmarksCount 
    }, { status: 200 });

  } catch (error) {
    console.error("Toggle Bookmark Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

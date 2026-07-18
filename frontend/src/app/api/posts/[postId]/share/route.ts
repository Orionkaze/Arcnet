import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fromUserId = session.userId as string;
    const body = await request.json().catch(() => ({}));
    const { recipientId } = body;

    if (!recipientId) {
      return NextResponse.json({ error: "Recipient ID is required" }, { status: 400 });
    }

    // Verify recipient is a real user (avoids FK 500 and prevents spamming arbitrary ids)
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });

    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    // Verify post exists
    const postExists = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!postExists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        type: "share",
        userId: recipientId,
        fromUserId,
        postId,
      },
    });

    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (error) {
    console.error("POST Share Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

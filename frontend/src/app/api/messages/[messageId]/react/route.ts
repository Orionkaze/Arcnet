import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId as string;

    const body = await request.json();
    const { emoji } = body;

    if (!emoji || typeof emoji !== "string" || emoji.trim() === "") {
      return NextResponse.json({ error: "Emoji cannot be empty" }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Toggle reaction
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    let reacted = false;
    if (existingReaction) {
      await prisma.messageReaction.delete({
        where: {
          id: existingReaction.id,
        },
      });
      reacted = false;
    } else {
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
      reacted = true;
    }

    // Fetch all reactions for this message to return updated list
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      reacted,
      reactions,
    });
  } catch (error) {
    console.error("POST /api/messages/[messageId]/react error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
      include: { channel: { select: { hubId: true } } },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // The reacting user must be a member of the hub that owns the channel that
    // owns this message. Without this, any authenticated user could react to
    // messages in hubs they don't belong to purely by message id.
    const membership = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId: message.channel.hubId,
          userId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You must be a member of this hub to react to messages." },
        { status: 403 }
      );
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const PUBLIC_USER_FIELDS = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  avatar: true,
} as const;

const MAX_MESSAGE_LENGTH = 2000;

/**
 * GET /api/conversations/[conversationId]
 * Return the conversation's messages (asc) plus the other participant.
 * Side effect: marks the other participant's unread messages as read.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = session.userId as string;
    const { conversationId } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: { select: PUBLIC_USER_FIELDS },
        user2: { select: PUBLIC_USER_FIELDS },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.user1Id !== me && conversation.user2Id !== me) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark the other participant's messages as read.
    await prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: me },
        isRead: false,
      },
      data: { isRead: true },
    });

    const messages = await prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        senderId: true,
        createdAt: true,
        isRead: true,
      },
    });

    const otherUser =
      conversation.user1Id === me ? conversation.user2 : conversation.user1;

    return NextResponse.json(
      {
        conversation: { id: conversation.id, otherUser },
        messages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Conversation Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations/[conversationId]
 * Send a message in the conversation. Bumps the conversation's updatedAt.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = session.userId as string;
    const { conversationId } = await params;

    const body = await request.json().catch(() => ({}));
    const rawContent = typeof body.content === "string" ? body.content : "";
    const content = rawContent.trim();

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { user1Id: true, user2Id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.user1Id !== me && conversation.user2Id !== me) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const created = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: me,
        content,
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        createdAt: true,
        isRead: true,
      },
    });

    // Bump the conversation so it sorts to the top of the list.
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Include conversationId so the recipient's client can route the message.
    const message = { ...created, conversationId };

    // Best-effort real-time delivery to the other participant. A broadcast
    // failure must NEVER break the send, so it's fire-and-forget.
    const recipientId =
      conversation.user1Id === me ? conversation.user2Id : conversation.user1Id;
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
    fetch(`${backendUrl}/api/broadcast-dm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: recipientId, message }),
    }).catch(() => {});

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("POST Message Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

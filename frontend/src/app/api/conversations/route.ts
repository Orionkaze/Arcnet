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

/**
 * GET /api/conversations
 * List all conversations for the authenticated user, each with the other
 * participant's public fields, the last message, and an unread count.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = session.userId as string;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: me }, { user2Id: me }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        user1: { select: PUBLIC_USER_FIELDS },
        user2: { select: PUBLIC_USER_FIELDS },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, senderId: true },
        },
        _count: {
          select: {
            messages: {
              where: { isRead: false, senderId: { not: me } },
            },
          },
        },
      },
    });

    const result = conversations.map((c) => {
      const otherUser = c.user1Id === me ? c.user2 : c.user1;
      const lastMessage = c.messages[0] || null;
      return {
        id: c.id,
        otherUser,
        lastMessage,
        unreadCount: c._count.messages,
        updatedAt: c.updatedAt,
      };
    });

    return NextResponse.json({ conversations: result }, { status: 200 });
  } catch (error) {
    console.error("GET Conversations Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations
 * Get-or-create a 1:1 conversation with a recipient (by { username } or
 * { recipientId }). Returns the conversation with the other user's public fields.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = session.userId as string;
    const body = await request.json().catch(() => ({}));
    const { username, recipientId } = body as {
      username?: string;
      recipientId?: string;
    };

    if (!username && !recipientId) {
      return NextResponse.json(
        { error: "A username or recipientId is required" },
        { status: 400 }
      );
    }

    const recipient = await prisma.user.findFirst({
      where: recipientId ? { id: recipientId } : { username: username as string },
      select: PUBLIC_USER_FIELDS,
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    if (recipient.id === me) {
      return NextResponse.json(
        { error: "Cannot message yourself" },
        { status: 400 }
      );
    }

    // Sort ids so the pair is unique regardless of who initiates.
    const [user1Id, user2Id] = [me, recipient.id].sort();

    let conversation = await prisma.conversation.findFirst({
      where: { user1Id, user2Id },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { user1Id, user2Id },
      });
    }

    return NextResponse.json(
      {
        conversation: {
          id: conversation.id,
          otherUser: recipient,
          updatedAt: conversation.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST Conversation Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

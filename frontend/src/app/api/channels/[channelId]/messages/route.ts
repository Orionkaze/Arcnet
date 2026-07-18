import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { createClient } from "redis";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const beforeId = searchParams.get("before");

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const whereClause: { channelId: string; createdAt?: { lt: Date } } = { channelId };

    if (beforeId) {
      const beforeMessage = await prisma.message.findUnique({
        where: { id: beforeId },
      });
      if (beforeMessage) {
        whereClause.createdAt = {
          lt: beforeMessage.createdAt,
        };
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        replyTo: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        reactions: {
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
        },
      },
    });

    // Reverse to get oldest to newest chronologically
    const chronologicalMessages = [...messages].reverse();

    // Load the channel's pinned message (if any) so clients can render the banner
    let pinnedMessage = null;
    if (channel.pinnedMessageId) {
      pinnedMessage = await prisma.message.findUnique({
        where: { id: channel.pinnedMessageId },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
              isVerified: true,
            },
          },
          replyTo: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
          reactions: {
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
          },
        },
      });
    }

    return NextResponse.json({
      messages: chronologicalMessages,
      pinnedMessage,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("GET /api/channels/[channelId]/messages error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId as string;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Verify user is a member of the hub
    const membership = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId: channel.hubId,
          userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You must be a member of this hub to send messages." },
        { status: 403 }
      );
    }

    // WARNING: This in-memory rate limiter does not work correctly across
    // multiple server instances. Replace with a Redis-backed counter in production.
    const limitKey = `message_creation:${userId}`;
    const rateLimitRes = checkRateLimit(limitKey, 10, 60000);
    if (!rateLimitRes.success) {
      return NextResponse.json(
        { error: "You're sending messages too fast. Rate limit: 10 messages per minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { content, replyToId } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: "Message cannot exceed 1000 characters" }, { status: 400 });
    }

    if (replyToId) {
      const parentMessage = await prisma.message.findUnique({
        where: { id: replyToId },
      });
      if (!parentMessage || parentMessage.channelId !== channelId) {
        return NextResponse.json({ error: "Invalid replyToId" }, { status: 400 });
      }
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        channelId,
        authorId: userId,
        replyToId: replyToId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            isVerified: true,
          },
        },
        replyTo: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        reactions: {
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
        },
      },
    });

    // Publish to Redis
    let published = false;
    try {
      const redisClient = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
        socket: {
          connectTimeout: 2000 // fail fast if local redis is not running
        }
      });
      redisClient.on("error", () => {}); // silence connection errors
      await redisClient.connect();
      await redisClient.publish("chat_messages", JSON.stringify({
        channelId,
        message
      }));
      await redisClient.quit();
      published = true;
    } catch (redisErr) {
      console.log("Redis publish failed, falling back to HTTP broadcast");
    }

    if (!published) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
        const response = await fetch(`${backendUrl}/api/broadcast`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channelId,
            message,
          }),
        });
        if (!response.ok) {
          console.error("HTTP broadcast failed:", response.status);
        }
      } catch (httpErr) {
        console.error("Failed to broadcast via HTTP:", httpErr);
      }
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/channels/[channelId]/messages error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

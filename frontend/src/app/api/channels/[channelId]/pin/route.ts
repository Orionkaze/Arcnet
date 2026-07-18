import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

    const body = await request.json();
    const { messageId } = body as { messageId: string | null };

    if (messageId !== null && typeof messageId !== "string") {
      return NextResponse.json({ error: "Invalid messageId" }, { status: 400 });
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Only hub admins/owners can pin/unpin messages
    const membership = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId: channel.hubId,
          userId,
        },
      },
    });

    if (!membership || !["admin", "owner"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only admins can pin messages" },
        { status: 403 }
      );
    }

    // If pinning (not clearing), verify the message exists in this channel
    if (messageId !== null) {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });
      if (!message || message.channelId !== channelId) {
        return NextResponse.json(
          { error: "Message not found in this channel" },
          { status: 400 }
        );
      }
    }

    await prisma.channel.update({
      where: { id: channelId },
      data: { pinnedMessageId: messageId },
    });

    // Best-effort broadcast so other clients update their pinned banner.
    // We send the FULL pinned message object (same shape as the messages GET),
    // or null when the pin is being cleared. A broadcast failure is non-fatal.
    try {
      let pinnedMessage = null;
      if (messageId !== null) {
        pinnedMessage = await prisma.message.findUnique({
          where: { id: messageId },
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

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
      const response = await fetch(`${backendUrl}/api/broadcast-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId,
          pinnedMessage,
        }),
      });
      if (!response.ok) {
        console.error("HTTP broadcast (pin) failed:", response.status);
      }
    } catch (broadcastErr) {
      console.error("Failed to broadcast pin update:", broadcastErr);
    }

    return NextResponse.json({ success: true, pinnedMessageId: messageId });
  } catch (error) {
    console.error("POST /api/channels/[channelId]/pin error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

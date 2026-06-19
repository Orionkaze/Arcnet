import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; requestId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, requestId } = await params;
    const { action } = await request.json(); // "approve" or "reject"

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const hub = await prisma.hub.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId: session.userId as string },
        },
      },
    });

    if (!hub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    const isOwner = hub.members.some(m => m.role === "owner");
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const joinRequest = await prisma.hubJoinRequest.findUnique({
      where: { id: requestId },
    });

    if (!joinRequest || joinRequest.hubId !== hub.id) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (joinRequest.status !== "pending") {
      return NextResponse.json({ error: "Request is already processed" }, { status: 400 });
    }

    if (action === "approve") {
      await prisma.$transaction(async (tx) => {
        // Update request
        await tx.hubJoinRequest.update({
          where: { id: requestId },
          data: { status: "approved" },
        });

        // Add user to hub
        await tx.hubMember.create({
          data: {
            hubId: hub.id,
            userId: joinRequest.userId,
            role: "member",
          },
        });

        // Increment member count
        await tx.hub.update({
          where: { id: hub.id },
          data: { memberCount: { increment: 1 } },
        });

        // Optional: create notification for the user who was approved
        await tx.notification.create({
          data: {
            type: "hub_request_approved",
            userId: joinRequest.userId,
            fromUserId: session.userId as string,
            postId: hub.slug,
          },
        });
      });
      return NextResponse.json({ message: "Request approved" }, { status: 200 });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.hubJoinRequest.update({
          where: { id: requestId },
          data: { status: "rejected" },
        });

        await tx.notification.create({
          data: {
            type: "hub_request_rejected",
            userId: joinRequest.userId,
            fromUserId: session.userId as string,
            postId: hub.slug,
          },
        });
      });
      return NextResponse.json({ message: "Request rejected" }, { status: 200 });
    }
  } catch (error) {
    console.error("Process Hub Request Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

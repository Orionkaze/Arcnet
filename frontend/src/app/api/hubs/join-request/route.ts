import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generous per-user limit; also slows join-code guessing.
    const rateLimit = checkRateLimit(
      `join_request:${session.userId as string}`,
      20,
      60 * 1000
    );
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const joinCode = typeof body.joinCode === "string" ? body.joinCode.trim() : "";

    if (!joinCode) {
      return NextResponse.json({ error: "Join code is required" }, { status: 400 });
    }

    const hub = await prisma.hub.findUnique({
      where: { joinCode: joinCode.toUpperCase() },
      include: {
        members: {
          where: { role: "owner" },
        },
      },
    });

    if (!hub) {
      return NextResponse.json({ error: "Invalid join code" }, { status: 404 });
    }

    if (!hub.isPrivate) {
      return NextResponse.json({ error: "This hub is public, please join it directly" }, { status: 400 });
    }

    const existingMember = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId: hub.id,
          userId: session.userId as string,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: "You are already a member of this hub" }, { status: 400 });
    }

    const existingRequest = await prisma.hubJoinRequest.findUnique({
      where: {
        hubId_userId: {
          hubId: hub.id,
          userId: session.userId as string,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return NextResponse.json({ error: "Join request already pending" }, { status: 400 });
      } else if (existingRequest.status === "rejected") {
        return NextResponse.json({ error: "Your previous join request was rejected" }, { status: 403 });
      } else {
        return NextResponse.json({ error: "You are already approved" }, { status: 400 });
      }
    }

    const newRequest = await prisma.hubJoinRequest.create({
      data: {
        hubId: hub.id,
        userId: session.userId as string,
      },
    });

    // Notify the hub owner(s)
    const owners = hub.members;
    for (const owner of owners) {
      await prisma.notification.create({
        data: {
          type: "hub_request",
          userId: owner.userId,
          fromUserId: session.userId as string,
          postId: hub.slug, // Storing hub slug in postId to reuse existing schema
        },
      });
    }

    return NextResponse.json({ message: "Join request sent successfully", request: newRequest }, { status: 201 });
  } catch (error) {
    console.error("Hub Join Request Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

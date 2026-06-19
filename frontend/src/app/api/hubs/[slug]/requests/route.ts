import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

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
      return NextResponse.json({ error: "Forbidden: Only owners can view requests" }, { status: 403 });
    }

    const requests = await prisma.hubJoinRequest.findMany({
      where: {
        hubId: hub.id,
        status: "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error("Fetch Hub Requests Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

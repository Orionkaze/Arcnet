import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowMembersToInvite } = await request.json();
    if (typeof allowMembersToInvite !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const hub = await prisma.hub.findUnique({
      where: { slug },
    });

    if (!hub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    // Check if user is admin or owner
    const membership = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId: hub.id,
          userId: session.userId as string,
        },
      },
    });

    if (!membership || !["admin", "owner"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden: Only admins can change group settings" }, { status: 403 });
    }

    const updatedHub = await prisma.hub.update({
      where: { id: hub.id },
      data: { allowMembersToInvite },
    });

    return NextResponse.json({ hub: updatedHub }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/hubs/[slug]/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

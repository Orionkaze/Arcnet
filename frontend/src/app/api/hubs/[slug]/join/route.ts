import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId as string;

    const hub = await prisma.hub.findUnique({
      where: { slug },
    });

    if (!hub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    // Toggle membership
    const existingMembership = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId: hub.id,
          userId,
        },
      },
    });

    let joined = false;
    if (existingMembership) {
      // Leave
      await prisma.hubMember.delete({
        where: {
          id: existingMembership.id,
        },
      });
      joined = false;
    } else {
      // Join
      if (hub.isPrivate) {
        return NextResponse.json(
          { error: "This hub is private. Request access with a join code." },
          { status: 403 }
        );
      }
      await prisma.hubMember.create({
        data: {
          hubId: hub.id,
          userId,
          role: "member",
        },
      });
      joined = true;
    }

    // Recompute memberCount from DB on join/leave
    const memberCount = await prisma.hubMember.count({
      where: { hubId: hub.id },
    });

    await prisma.hub.update({
      where: { id: hub.id },
      data: { memberCount },
    });

    return NextResponse.json({
      joined,
      memberCount,
    });
  } catch (error) {
    console.error("POST /api/hubs/[slug]/join error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    const userId = session?.userId as string | undefined;

    const hub = await prisma.hub.findUnique({
      where: { slug },
      include: {
        channels: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!hub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const onlineCount = await prisma.hubMember.count({
      where: {
        hubId: hub.id,
        user: {
          lastSeen: {
            gte: fiveMinutesAgo,
          },
        },
      },
    });

    let joined = false;
    let userRole = null;
    if (userId) {
      const membership = await prisma.hubMember.findUnique({
        where: {
          hubId_userId: {
            hubId: hub.id,
            userId,
          },
        },
      });
      if (membership) {
        joined = true;
        userRole = membership.role;
      }
    }

    const moderators = await prisma.hubMember.findMany({
      where: {
        hubId: hub.id,
        role: {
          in: ["moderator", "admin"],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            isVerified: true,
            lastSeen: true,
          },
        },
      },
    });

    return NextResponse.json({
      hub: {
        ...hub,
        onlineCount,
        joined,
        userRole,
        moderators: moderators.map((m) => ({
          id: m.id,
          role: m.role,
          user: m.user,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/hubs/[slug] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

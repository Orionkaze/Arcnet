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

    if (hub.isPrivate) {
      if (!session?.userId) {
        return NextResponse.json({ error: "This is a private hub." }, { status: 403 });
      }
      const membership = await prisma.hubMember.findUnique({
        where: {
          hubId_userId: {
            hubId: hub.id,
            userId: session.userId as string,
          },
        },
      });
      if (!membership) {
        return NextResponse.json({ error: "This is a private hub." }, { status: 403 });
      }
    }

    return NextResponse.json({ channels: hub.channels });
  } catch (error) {
    console.error("GET /api/hubs/[slug]/channels error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

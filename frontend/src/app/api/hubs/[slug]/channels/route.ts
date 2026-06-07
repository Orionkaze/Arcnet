import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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

    return NextResponse.json({ channels: hub.channels });
  } catch (error) {
    console.error("GET /api/hubs/[slug]/channels error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

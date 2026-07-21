import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rows = await prisma.caliberRating.findMany({
      where: { userId: session.userId as string },
      select: { trackId: true, value: true, updatedAt: true },
      orderBy: { value: "desc" },
    });
    // CaliberRating has no relation to CaliberTrack (trackId is a bare string),
    // so resolve human-readable names/slugs in one batched query and attach them.
    const tracks = await prisma.caliberTrack.findMany({
      where: { id: { in: rows.map((r) => r.trackId) } },
      select: { id: true, name: true, slug: true },
    });
    const byId = new Map(tracks.map((t) => [t.id, t]));
    const ratings = rows.map((r) => ({
      ...r,
      trackName: byId.get(r.trackId)?.name ?? "Unknown track",
      trackSlug: byId.get(r.trackId)?.slug ?? null,
    }));
    return NextResponse.json({ ratings });
  } catch (error) {
    console.error("GET caliber ratings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

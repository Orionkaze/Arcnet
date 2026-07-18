import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicProblem, type ProblemRow } from "@/lib/caliber/domain/mapProblem";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const track = await prisma.caliberTrack.findUnique({ where: { slug } });
    if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

    const rows = await prisma.caliberProblem.findMany({
      where: { trackId: track.id, status: "published" },
      orderBy: { difficulty: "asc" },
      select: { id: true, trackId: true, type: true, prompt: true, difficulty: true, maxPoints: true, config: true },
    });
    const problems = rows.map((r) => toPublicProblem(r as unknown as ProblemRow));
    return NextResponse.json({ track: { slug: track.slug, name: track.name }, problems });
  } catch (error) {
    console.error("GET caliber track problems error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicProblem, type ProblemRow } from "@/lib/caliber/domain/mapProblem";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await prisma.caliberProblem.findUnique({
      where: { id },
      select: { id: true, trackId: true, type: true, prompt: true, difficulty: true, maxPoints: true, config: true, status: true },
    });
    if (!row || row.status !== "published") {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }
    return NextResponse.json({ problem: toPublicProblem(row as unknown as ProblemRow) });
  } catch (error) {
    console.error("GET caliber problem error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

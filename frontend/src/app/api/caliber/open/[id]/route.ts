import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const p = await prisma.caliberOpenProblem.findUnique({
      where: { id },
      select: { id: true, trackId: true, prompt: true, rubric: true, maxPoints: true, status: true },
    });
    if (!p || p.status !== "published") return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    return NextResponse.json({ problem: { id: p.id, trackId: p.trackId, prompt: p.prompt, rubric: p.rubric, maxPoints: p.maxPoints } });
  } catch (error) {
    console.error("GET caliber open problem error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

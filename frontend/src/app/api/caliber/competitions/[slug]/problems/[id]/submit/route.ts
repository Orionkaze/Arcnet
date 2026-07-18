import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { competitionState } from "@/lib/caliber/domain/competition";
import { toEngineProblem, type ProblemRow } from "@/lib/caliber/domain/mapProblem";
import { evaluate } from "@/lib/caliber/evaluation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.userId as string;

    const rl = await checkRateLimit(`caliber_comp_submit:${userId}`, 60, 60_000);
    if (!rl.success) return NextResponse.json({ error: "Slow down." }, { status: 429 });

    const comp = await prisma.caliberCompetition.findUnique({ where: { slug }, select: { id: true, startsAt: true, endsAt: true } });
    if (!comp) return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    if (competitionState(Date.now(), comp.startsAt.getTime(), comp.endsAt.getTime()) !== "live") {
      return NextResponse.json({ error: "Competition is not live." }, { status: 400 });
    }

    const entry = await prisma.caliberCompetitionEntry.findUnique({
      where: { competitionId_userId: { competitionId: comp.id, userId } }, select: { id: true },
    });
    if (!entry) return NextResponse.json({ error: "Join the competition first." }, { status: 403 });

    const link = await prisma.caliberCompetitionProblem.findUnique({
      where: { competitionId_problemId: { competitionId: comp.id, problemId: id } }, select: { id: true },
    });
    if (!link) return NextResponse.json({ error: "Problem is not in this competition." }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const value = body?.value;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return NextResponse.json({ error: "A numeric 'value' is required" }, { status: 400 });
    }

    const row = await prisma.caliberProblem.findUnique({
      where: { id },
      select: { id: true, trackId: true, type: true, prompt: true, difficulty: true, maxPoints: true, config: true },
    });
    if (!row) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

    const result = evaluate(toEngineProblem(row as unknown as ProblemRow), { value });

    try {
      await prisma.$transaction(async (tx) => {
        await tx.caliberCompetitionSubmission.create({
          data: { competitionId: comp.id, problemId: id, userId, value, score: result.score },
        });
        const agg = await tx.caliberCompetitionSubmission.aggregate({
          where: { competitionId: comp.id, userId }, _sum: { score: true },
        });
        await tx.caliberCompetitionEntry.update({
          where: { competitionId_userId: { competitionId: comp.id, userId } },
          data: { totalScore: agg._sum.score ?? 0, lastScoredAt: new Date() },
        });
      });
    } catch (err) {
      // Unique violation => already answered this problem in this competition.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json({ error: "You already answered this problem." }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({ result: { score: result.score, maxPoints: result.maxPoints, feedback: result.feedback } });
  } catch (error) {
    console.error("POST caliber competition submit error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

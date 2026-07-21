import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { competitionState } from "@/lib/caliber/domain/competition";
import { toPublicProblem, type ProblemRow } from "@/lib/caliber/domain/mapProblem";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const comp = await prisma.caliberCompetition.findUnique({
      where: { slug },
      include: {
        problems: {
          orderBy: { order: "asc" },
          select: {
            problemId: true,
            problem: { select: { id: true, trackId: true, type: true, prompt: true, difficulty: true, maxPoints: true, config: true } },
          },
        },
      },
    });
    if (!comp) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    const now = Date.now();
    const state = competitionState(now, comp.startsAt.getTime(), comp.endsAt.getTime());
    // Problems are only revealed once the competition is live or ended (never before start).
    const problems = state === "upcoming"
      ? []
      : comp.problems.map((cp) => toPublicProblem(cp.problem as unknown as ProblemRow));

    // Session is optional here (the page is publicly viewable), but when present
    // report whether the viewer has joined and which problems they already
    // answered, so the UI can show a solve form instead of a static card.
    let joined = false;
    let answeredProblemIds: string[] = [];
    const session = await getSession();
    if (session?.userId) {
      const userId = session.userId as string;
      const [entry, submissions] = await Promise.all([
        prisma.caliberCompetitionEntry.findUnique({
          where: { competitionId_userId: { competitionId: comp.id, userId } },
          select: { id: true },
        }),
        prisma.caliberCompetitionSubmission.findMany({
          where: { competitionId: comp.id, userId },
          select: { problemId: true },
        }),
      ]);
      joined = !!entry;
      answeredProblemIds = submissions.map((s) => s.problemId);
    }

    return NextResponse.json({
      competition: { slug: comp.slug, name: comp.name, description: comp.description, startsAt: comp.startsAt, endsAt: comp.endsAt, state },
      problems,
      joined,
      answeredProblemIds,
    });
  } catch (error) {
    console.error("GET caliber competition error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

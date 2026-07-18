import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rankLeaderboard } from "@/lib/caliber/domain/competition";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const comp = await prisma.caliberCompetition.findUnique({ where: { slug }, select: { id: true } });
    if (!comp) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    const entries = await prisma.caliberCompetitionEntry.findMany({
      where: { competitionId: comp.id, lastScoredAt: { not: null } },
      select: {
        userId: true, totalScore: true, lastScoredAt: true,
        user: { select: { username: true, firstName: true, lastName: true, avatar: true } },
      },
    });
    const ranked = rankLeaderboard(
      entries.map((e) => ({ userId: e.userId, score: e.totalScore, lastAt: e.lastScoredAt!.getTime() })),
    );
    const byId = new Map(entries.map((e) => [e.userId, e.user]));
    const leaderboard = ranked.map((r) => ({ rank: r.rank, score: r.score, user: byId.get(r.userId) }));
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("GET caliber leaderboard error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

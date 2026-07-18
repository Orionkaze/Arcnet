import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { competitionState } from "@/lib/caliber/domain/competition";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.userId as string;

    const rl = await checkRateLimit(`caliber_comp_join:${userId}`, 20, 60_000);
    if (!rl.success) return NextResponse.json({ error: "Slow down." }, { status: 429 });

    const comp = await prisma.caliberCompetition.findUnique({ where: { slug }, select: { id: true, startsAt: true, endsAt: true } });
    if (!comp) return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    if (competitionState(Date.now(), comp.startsAt.getTime(), comp.endsAt.getTime()) === "ended") {
      return NextResponse.json({ error: "This competition has ended." }, { status: 400 });
    }

    await prisma.caliberCompetitionEntry.upsert({
      where: { competitionId_userId: { competitionId: comp.id, userId } },
      create: { competitionId: comp.id, userId },
      update: {},
    });
    return NextResponse.json({ joined: true });
  } catch (error) {
    console.error("POST caliber competition join error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

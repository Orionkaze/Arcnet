import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { competitionState } from "@/lib/caliber/domain/competition";

export async function GET() {
  try {
    const now = Date.now();
    const rows = await prisma.caliberCompetition.findMany({
      orderBy: { startsAt: "desc" },
      select: { id: true, slug: true, name: true, description: true, startsAt: true, endsAt: true },
    });
    const competitions = rows.map((c) => ({
      ...c,
      state: competitionState(now, c.startsAt.getTime(), c.endsAt.getTime()),
    }));
    return NextResponse.json({ competitions });
  } catch (error) {
    console.error("GET caliber competitions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

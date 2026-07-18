import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { toEngineProblem, type ProblemRow } from "@/lib/caliber/domain/mapProblem";
import { processSubmission } from "@/lib/caliber/domain/processSubmission";
import { DEFAULT_RATING } from "@/lib/caliber/rating";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId as string;

    const rl = await checkRateLimit(`caliber_submit:${userId}`, 60, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "Slow down — too many submissions." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const value = body?.value;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return NextResponse.json({ error: "A numeric 'value' is required" }, { status: 400 });
    }

    const row = await prisma.caliberProblem.findUnique({
      where: { id },
      select: { id: true, trackId: true, type: true, prompt: true, difficulty: true, maxPoints: true, config: true, status: true },
    });
    if (!row || row.status !== "published") {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const engineProblem = toEngineProblem(row as unknown as ProblemRow);

    const [prior, ratingRow] = await Promise.all([
      prisma.caliberSubmission.findFirst({ where: { problemId: id, userId }, select: { id: true } }),
      prisma.caliberRating.findUnique({ where: { userId_trackId: { userId, trackId: row.trackId } }, select: { value: true } }),
    ]);
    const countsForRating = !prior;
    const currentRating = ratingRow?.value ?? DEFAULT_RATING;

    const { result, newRating, ratingDelta } = processSubmission(
      engineProblem, { value }, currentRating, countsForRating,
    );

    await prisma.$transaction(async (tx) => {
      await tx.caliberSubmission.create({
        data: { problemId: id, userId, value, score: result.score, feedback: result.feedback, countedForRating: countsForRating },
      });
      if (countsForRating) {
        await tx.caliberRating.upsert({
          where: { userId_trackId: { userId, trackId: row.trackId } },
          create: { userId, trackId: row.trackId, value: newRating },
          update: { value: newRating },
        });
        await tx.caliberRatingHistory.create({
          data: { userId, trackId: row.trackId, value: newRating, delta: ratingDelta, problemId: id },
        });
      }
    });

    return NextResponse.json({
      result: { score: result.score, maxPoints: result.maxPoints, feedback: result.feedback },
      rating: newRating,
      ratingDelta,
      countedForRating: countsForRating,
    });
  } catch (error) {
    console.error("POST caliber submit error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

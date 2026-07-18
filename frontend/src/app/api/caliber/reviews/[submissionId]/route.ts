import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { aggregateReviews } from "@/lib/caliber/domain/aggregateReviews";

interface Criterion { key: string; label: string; maxPoints: number; }

export async function POST(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const reviewerId = session.userId as string;

    const rl = await checkRateLimit(`caliber_review:${reviewerId}`, 40, 60_000);
    if (!rl.success) return NextResponse.json({ error: "Slow down." }, { status: 429 });

    const sub = await prisma.caliberOpenSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, userId: true, problem: { select: { rubric: true } } },
    });
    if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    if (sub.userId === reviewerId) return NextResponse.json({ error: "You cannot review your own submission." }, { status: 403 });

    const rubric = (sub.problem.rubric as unknown as Criterion[]) || [];
    const body = await request.json().catch(() => ({}));
    const scores = body?.scores;
    if (typeof scores !== "object" || scores === null) return NextResponse.json({ error: "scores object required" }, { status: 400 });

    // Validate: every criterion present, an integer within [0, maxPoints].
    let total = 0;
    for (const c of rubric) {
      const v = (scores as Record<string, unknown>)[c.key];
      if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > c.maxPoints) {
        return NextResponse.json({ error: `Invalid score for "${c.key}" (0..${c.maxPoints})` }, { status: 400 });
      }
      total += v;
    }

    try {
      await prisma.caliberReview.create({ data: { submissionId, reviewerId, scores, total } });
    } catch {
      return NextResponse.json({ error: "You already reviewed this submission." }, { status: 409 });
    }

    // Recompute aggregate from all reviews.
    const reviews = await prisma.caliberReview.findMany({ where: { submissionId }, select: { total: true } });
    const agg = aggregateReviews(reviews.map((r) => r.total));
    await prisma.caliberOpenSubmission.update({
      where: { id: submissionId },
      data: { status: agg.status, score: agg.score },
    });

    return NextResponse.json({ ok: true, aggregate: agg });
  } catch (error) {
    console.error("POST caliber review error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

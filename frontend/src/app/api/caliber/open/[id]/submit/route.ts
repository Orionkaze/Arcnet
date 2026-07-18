import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_ANSWER = 10_000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.userId as string;

    const rl = await checkRateLimit(`caliber_open_submit:${userId}`, 20, 60_000);
    if (!rl.success) return NextResponse.json({ error: "Slow down." }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const answer = typeof body?.answer === "string" ? body.answer.trim() : "";
    if (!answer) return NextResponse.json({ error: "An answer is required" }, { status: 400 });
    if (answer.length > MAX_ANSWER) return NextResponse.json({ error: `Answer must be ${MAX_ANSWER} characters or fewer` }, { status: 400 });

    const problem = await prisma.caliberOpenProblem.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!problem || problem.status !== "published") return NextResponse.json({ error: "Problem not found" }, { status: 404 });

    const existing = await prisma.caliberOpenSubmission.findFirst({ where: { problemId: id, userId }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "You already submitted this problem." }, { status: 409 });

    const created = await prisma.caliberOpenSubmission.create({
      data: { problemId: id, userId, answer }, select: { id: true, status: true },
    });
    return NextResponse.json({ submission: created }, { status: 201 });
  } catch (error) {
    console.error("POST caliber open submit error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.userId as string;

    const subs = await prisma.caliberOpenSubmission.findMany({
      where: {
        status: "pending",
        userId: { not: userId },
        reviews: { none: { reviewerId: userId } },
      },
      take: 20,
      orderBy: { createdAt: "asc" },
      select: {
        id: true, answer: true,
        problem: { select: { id: true, prompt: true, rubric: true, maxPoints: true } },
      },
    });
    return NextResponse.json({ tasks: subs });
  } catch (error) {
    console.error("GET caliber review queue error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

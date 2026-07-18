import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const submissions = await prisma.caliberOpenSubmission.findMany({
      where: { userId: session.userId as string },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, score: true, createdAt: true, problem: { select: { id: true, prompt: true, maxPoints: true } } },
    });
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("GET caliber my open submissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

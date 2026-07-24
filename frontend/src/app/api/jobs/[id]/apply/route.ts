import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Toggle the signed-in user's application to a job.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Log in to apply." }, { status: 401 });
    }
    const userId = session.userId as string;

    const job = await prisma.job.findUnique({ where: { id }, select: { id: true } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const existing = await prisma.jobApplication.findUnique({
      where: { jobId_userId: { jobId: id, userId } },
      select: { id: true },
    });

    if (existing) {
      await prisma.jobApplication.delete({ where: { id: existing.id } });
      return NextResponse.json({ applied: false });
    }

    try {
      await prisma.jobApplication.create({ data: { jobId: id, userId } });
    } catch (err) {
      // Concurrent double-apply — treat as already applied.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json({ applied: true });
      }
      throw err;
    }
    return NextResponse.json({ applied: true });
  } catch (error) {
    console.error("POST /api/jobs/[id]/apply error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

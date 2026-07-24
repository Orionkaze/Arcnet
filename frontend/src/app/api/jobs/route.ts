import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Public job board. When signed in, each job carries `applied` so the UI can
// reflect the viewer's existing applications.
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({ orderBy: { postedAt: "desc" } });

    const session = await getSession();
    let appliedIds = new Set<string>();
    if (session?.userId) {
      const apps = await prisma.jobApplication.findMany({
        where: { userId: session.userId as string },
        select: { jobId: true },
      });
      appliedIds = new Set(apps.map((a) => a.jobId));
    }

    return NextResponse.json({
      jobs: jobs.map((j) => ({ ...j, applied: appliedIds.has(j.id) })),
    });
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

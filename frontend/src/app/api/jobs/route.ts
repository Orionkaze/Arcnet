import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EMPLOYMENT_TYPES = ["Full-Time", "Internship", "Contract", "Remote"];

// Public job board. When signed in, each job carries `applied` (viewer's
// application) and `mine` (viewer posted it) so the UI can show apply/delete.
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({ orderBy: { postedAt: "desc" } });

    const session = await getSession();
    let appliedIds = new Set<string>();
    const userId = session?.userId ? (session.userId as string) : null;
    if (userId) {
      const apps = await prisma.jobApplication.findMany({
        where: { userId },
        select: { jobId: true },
      });
      appliedIds = new Set(apps.map((a) => a.jobId));
    }

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        ...j,
        applied: appliedIds.has(j.id),
        mine: !!userId && j.postedById === userId,
      })),
    });
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Post a new role (auth required). The job is owned by the poster.
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Log in to post a role." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body?.title ?? "").trim();
    const company = String(body?.company ?? "").trim();
    const location = String(body?.location ?? "").trim();
    const type = String(body?.type ?? "").trim();
    const ctc = String(body?.ctc ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const skills = Array.isArray(body?.skills)
      ? body.skills.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 12)
      : String(body?.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12);

    if (!title || !company || !location || !ctc || !description) {
      return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
    }
    if (!EMPLOYMENT_TYPES.includes(type)) {
      return NextResponse.json({ error: "Pick a valid employment type." }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        title, company, location, type, ctc, description, skills,
        postedById: session.userId as string,
      },
    });
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("POST /api/jobs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

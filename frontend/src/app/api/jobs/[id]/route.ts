import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Delete a role — only the user who posted it may remove it.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const job = await prisma.job.findUnique({ where: { id }, select: { postedById: true } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job.postedById !== (session.userId as string)) {
      return NextResponse.json({ error: "You can only delete your own listing." }, { status: 403 });
    }

    await prisma.job.delete({ where: { id } }); // applications cascade
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/jobs/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

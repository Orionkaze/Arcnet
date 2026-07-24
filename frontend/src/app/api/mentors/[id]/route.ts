import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Remove your own mentor listing.
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

    const mentor = await prisma.mentor.findUnique({ where: { id }, select: { userId: true } });
    if (!mentor) return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    if (mentor.userId !== (session.userId as string)) {
      return NextResponse.json({ error: "You can only remove your own listing." }, { status: 403 });
    }

    await prisma.mentor.delete({ where: { id } }); // bookings cascade
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/mentors/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

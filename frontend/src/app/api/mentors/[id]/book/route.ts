import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Toggle the signed-in user's session request with a mentor.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Log in to book a session." }, { status: 401 });
    }
    const userId = session.userId as string;

    const mentor = await prisma.mentor.findUnique({ where: { id }, select: { id: true } });
    if (!mentor) return NextResponse.json({ error: "Mentor not found" }, { status: 404 });

    const existing = await prisma.mentorBooking.findUnique({
      where: { mentorId_userId: { mentorId: id, userId } },
      select: { id: true },
    });

    if (existing) {
      await prisma.mentorBooking.delete({ where: { id: existing.id } });
      return NextResponse.json({ requested: false });
    }

    try {
      await prisma.mentorBooking.create({ data: { mentorId: id, userId } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json({ requested: true });
      }
      throw err;
    }
    return NextResponse.json({ requested: true });
  } catch (error) {
    console.error("POST /api/mentors/[id]/book error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

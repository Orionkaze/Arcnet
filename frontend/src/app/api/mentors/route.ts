import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Public mentor directory. When signed in, each mentor carries `requested` so
// the UI reflects the viewer's existing session requests.
export async function GET() {
  try {
    const mentors = await prisma.mentor.findMany({ orderBy: { rating: "desc" } });

    const session = await getSession();
    let requestedIds = new Set<string>();
    if (session?.userId) {
      const bookings = await prisma.mentorBooking.findMany({
        where: { userId: session.userId as string },
        select: { mentorId: true },
      });
      requestedIds = new Set(bookings.map((b) => b.mentorId));
    }

    return NextResponse.json({
      mentors: mentors.map((m) => ({ ...m, requested: requestedIds.has(m.id) })),
    });
  } catch (error) {
    console.error("GET /api/mentors error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

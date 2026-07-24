import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SPECIALTIES = ["Consulting", "Finance", "Product", "Data", "Aptitude"];

// Public mentor directory. When signed in, each mentor carries `requested`
// (viewer's session request) and `mine` (the viewer's own listing).
export async function GET() {
  try {
    const mentors = await prisma.mentor.findMany({ orderBy: { rating: "desc" } });

    const session = await getSession();
    const userId = session?.userId ? (session.userId as string) : null;
    let requestedIds = new Set<string>();
    if (userId) {
      const bookings = await prisma.mentorBooking.findMany({
        where: { userId },
        select: { mentorId: true },
      });
      requestedIds = new Set(bookings.map((b) => b.mentorId));
    }

    return NextResponse.json({
      mentors: mentors.map((m) => ({
        ...m,
        requested: requestedIds.has(m.id),
        mine: !!userId && m.userId === userId,
      })),
    });
  } catch (error) {
    console.error("GET /api/mentors error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Create or update the signed-in user's own mentor listing (one per user).
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Log in to list yourself." }, { status: 401 });
    }
    const userId = session.userId as string;

    const body = await request.json().catch(() => ({}));
    const firstName = String(body?.firstName ?? "").trim();
    const lastName = String(body?.lastName ?? "").trim();
    const role = String(body?.role ?? "").trim();
    const company = String(body?.company ?? "").trim();
    const specialty = String(body?.specialty ?? "").trim();
    const bio = String(body?.bio ?? "").trim();
    const years = Number(body?.years);
    const price = Number(body?.price);
    const expertise = Array.isArray(body?.expertise)
      ? body.expertise.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 8)
      : String(body?.expertise ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8);

    if (!firstName || !lastName || !role || !company || !bio) {
      return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
    }
    if (!SPECIALTIES.includes(specialty)) {
      return NextResponse.json({ error: "Pick a valid specialty." }, { status: 400 });
    }
    if (!Number.isFinite(years) || years < 0 || years > 60) {
      return NextResponse.json({ error: "Enter valid years of experience." }, { status: 400 });
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Enter a valid session price." }, { status: 400 });
    }

    // One listing per user: upsert on the unique userId. New listings start
    // unverified with no sessions; rating seeds neutral so they still sort in.
    const data = {
      firstName, lastName, role, company, specialty, bio, expertise,
      years: Math.floor(years), price: Math.floor(price),
    };
    const mentor = await prisma.mentor.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId, rating: 0, sessions: 0, verified: false },
    });
    return NextResponse.json({ mentor }, { status: 201 });
  } catch (error) {
    console.error("POST /api/mentors error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

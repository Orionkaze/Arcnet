import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Records a "notify me when this ships" signup for a not-yet-built feature
// (e.g. AI Match). Auth-optional; associates the userId when present.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const feature = typeof body?.feature === "string" ? body.feature.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!feature) return NextResponse.json({ error: "Missing feature." }, { status: 400 });
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }

    const session = await getSession();
    const userId = session?.userId ? (session.userId as string) : null;

    try {
      await prisma.waitlistEntry.create({ data: { feature, email, userId } });
    } catch (err) {
      // Already on the list for this feature — idempotent success.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json({ ok: true, alreadyOnList: true });
      }
      throw err;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/waitlist error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

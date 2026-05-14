import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const RESERVED_WORDS = ["admin", "arcnet", "support", "root", "system", "moderator"];

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json();

    if (!username || username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }

    // Check reserved words
    if (RESERVED_WORDS.includes(username.toLowerCase())) {
      return NextResponse.json({ available: false, reason: "Reserved username" }, { status: 200 });
    }

    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      // If it's our own username, it's valid to keep
      if (existing.id === session.userId) {
        return NextResponse.json({ available: true }, { status: 200 });
      }
      return NextResponse.json({ available: false, reason: "Username taken" }, { status: 200 });
    }

    return NextResponse.json({ available: true }, { status: 200 });
  } catch (error) {
    console.error("Check Username Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const ratings = await prisma.caliberRating.findMany({
      where: { userId: session.userId as string },
      select: { trackId: true, value: true, updatedAt: true },
      orderBy: { value: "desc" },
    });
    return NextResponse.json({ ratings });
  } catch (error) {
    console.error("GET caliber ratings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

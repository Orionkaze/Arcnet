import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tracks = await prisma.caliberTrack.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, kind: true, description: true },
    });
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("GET caliber tracks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

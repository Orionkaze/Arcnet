import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId as string;
    const body = await request.json();
    const { role, company, startDate, endDate, current, description } = body;

    if (!role || !company || !startDate) {
      return NextResponse.json({ error: "Role, company, and start date are required" }, { status: 400 });
    }

    const experience = await prisma.experience.create({
      data: {
        role,
        company,
        startDate,
        endDate: current ? null : endDate,
        current: !!current,
        description: description || null,
        userId,
      },
    });

    return NextResponse.json({ experience }, { status: 201 });
  } catch (error) {
    console.error("Add Experience Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId as string;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Experience ID is required" }, { status: 400 });
    }

    // Verify ownership
    const exp = await prisma.experience.findUnique({ where: { id } });
    if (!exp) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }
    if (exp.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.experience.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete Experience Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

    // Type-validate (never coerce) and cap lengths.
    if (typeof role !== "string" || typeof company !== "string" || typeof startDate !== "string") {
      return NextResponse.json({ error: "Role, company, and start date must be strings" }, { status: 400 });
    }
    if (endDate !== undefined && endDate !== null && typeof endDate !== "string") {
      return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
    }
    if (description !== undefined && description !== null && typeof description !== "string") {
      return NextResponse.json({ error: "Invalid description" }, { status: 400 });
    }
    if (role.length > 100 || company.length > 100) {
      return NextResponse.json({ error: "Role and company must be under 100 characters" }, { status: 400 });
    }
    if (startDate.length > 50 || (typeof endDate === "string" && endDate.length > 50)) {
      return NextResponse.json({ error: "Invalid date value" }, { status: 400 });
    }
    if (typeof description === "string" && description.length > 1000) {
      return NextResponse.json({ error: "Description cannot exceed 1000 characters" }, { status: 400 });
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

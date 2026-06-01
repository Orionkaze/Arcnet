import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cover } = body;

    if (cover === undefined) {
      return NextResponse.json({ error: "Cover value is required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId as string },
      data: { cover: cover || null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        avatar: true,
        cover: true,
        isVerified: true,
        isOnboarded: true,
        bio: true,
        role: true,
        location: true,
        skills: true,
        socialLinks: true,
      },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Update Cover API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

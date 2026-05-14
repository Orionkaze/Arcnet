import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const avatarSchema = z.object({
  avatarUrl: z.string().min(1, "Avatar URL is required"),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = avatarSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { avatarUrl } = result.data;

    const updatedUser = await prisma.user.update({
      where: { id: session.userId as string },
      data: { avatarUrl },
    });

    return NextResponse.json({ success: true, user: {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      username: updatedUser.username,
      avatarUrl: updatedUser.avatarUrl,
      isEmailVerified: updatedUser.isEmailVerified
    }}, { status: 200 });

  } catch (error) {
    console.error("Setup Avatar Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

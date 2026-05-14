import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { setAuthCookies } from "@/lib/auth";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = verifySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const { email, code } = result.data;

    const verification = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    if (verification.expiresAt < new Date()) {
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
    });

    // Delete used code
    await prisma.verificationCode.delete({ where: { id: verification.id } });

    // Set auth cookies so user is logged in
    await setAuthCookies(user.id);

    return NextResponse.json({ success: true, user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified
    }}, { status: 200 });

  } catch (error) {
    console.error("Verify Email Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

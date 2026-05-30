import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendEmail, getPasswordResetEmailHtml } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email } = result.data;

    // Rate limit forgot password requests (3 per hour per email)
    const rateLimit = checkRateLimit(`forgot_pw_${email}`, 3, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success even if user not found to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(resetToken, 12);
    const passwordResetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetTokenExpiry,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your ARCNET password",
      html: getPasswordResetEmailHtml(resetLink),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  token: z.string().min(1, "Token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(req: Request) {
  try {
    // IP-based limiter (mirrors login) to slow token brute-forcing.
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const ipRateLimit = await checkRateLimit(`reset_pw_ip_${ip}`, 10, 15 * 60 * 1000);
    if (!ipRateLimit.success) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in 15 minutes.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email, token, newPassword } = result.data;

    // Per-value limiters so a single token/account can't be hammered even
    // from rotating IPs. Same 429 shape.
    const tokenRateLimit = await checkRateLimit(`reset_pw_token_${token}`, 10, 15 * 60 * 1000);
    const emailRateLimit = await checkRateLimit(
      `reset_pw_email_${email.toLowerCase()}`,
      10,
      15 * 60 * 1000,
    );
    if (!tokenRateLimit.success || !emailRateLimit.success) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in 15 minutes.` },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordResetToken || !user.passwordResetTokenExpiry) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    if (new Date() > user.passwordResetTokenExpiry) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(token, user.passwordResetToken);
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);

    // Update password and invalidate token simultaneously
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

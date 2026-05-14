import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success to avoid email enumeration
      return NextResponse.json({ success: true });
    }

    // Rate limiting: check recent requests
    const recentRequests = await prisma.passwordResetToken.count({
      where: {
        email,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // last hour
      }
    });

    if (recentRequests >= 3) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    // Delete existing tokens
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    const token = crypto.randomBytes(32).toString("hex");
    
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      }
    });

    console.log(`[MOCK EMAIL] Password reset link for ${email} is http://localhost:3000/reset-password?token=${token}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { sendEmail, getOTPVerificationEmailHtml } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Rate limit resends (3 per hour per email)
    const rateLimit = await checkRateLimit(`resend_otp_${email}`, 3, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.isVerified) {
      // Don't reveal if user exists or is already verified to prevent enumeration
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpCode, 12);
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: hashedOtp,
        otpExpiry,
      },
    });

    await sendEmail({
      to: user.email,
      subject: "Verify your ARCNET account",
      html: getOTPVerificationEmailHtml(otpCode),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

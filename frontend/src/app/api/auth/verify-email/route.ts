import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setAuthCookiesOnResponse } from "@/lib/auth";
import bcrypt from "bcrypt";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    // Rate limit OTP attempts (5 per 15 minutes)
    const rateLimit = checkRateLimit(`otp_attempt_${email}`, 5, 15 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many attempts. Account temporarily locked from verification." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.otpCode || !user.otpExpiry) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    if (new Date() > user.otpExpiry) {
      return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
    }

    const isValid = await bcrypt.compare(code, user.otpCode);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // Success - verify user and clear OTP fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
    });

    // Set cookies on the response object (required for Route Handlers)
    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email } }, { status: 200 });
    await setAuthCookiesOnResponse(response, user.id);

    return response;
  } catch (error) {
    console.error("Verify Email Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


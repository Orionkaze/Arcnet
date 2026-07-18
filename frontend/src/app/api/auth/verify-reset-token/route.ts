import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(req: Request) {
  try {
    // IP-based limiter (mirrors login) to slow token brute-forcing.
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const ipRateLimit = await checkRateLimit(`verify_reset_ip_${ip}`, 20, 15 * 60 * 1000);
    if (!ipRateLimit.success) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in 15 minutes.` },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Per-token limiter so a single token can't be hammered from rotating IPs.
    const tokenRateLimit = await checkRateLimit(`verify_reset_token_${token}`, 20, 15 * 60 * 1000);
    if (!tokenRateLimit.success) {
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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Verify Reset Token Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

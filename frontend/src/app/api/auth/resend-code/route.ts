import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if user doesn't exist for security reasons
      return NextResponse.json({ success: true });
    }

    // Delete existing codes
    await prisma.verificationCode.deleteMany({
      where: { email },
    });

    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await prisma.verificationCode.create({
      data: {
        email,
        code: mockCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      }
    });

    console.log(`[MOCK EMAIL RESEND] Verification code for ${email} is ${mockCode}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend Code Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

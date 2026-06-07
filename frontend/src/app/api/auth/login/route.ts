import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, setAuthCookiesOnResponse } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = checkRateLimit(`login_${ip}`, 5, 15 * 60 * 1000);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in 15 minutes.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ error: "Account not verified. Check your email." }, { status: 403 });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Success - set cookies on the response object (required for Route Handlers)
    const response = NextResponse.json({ success: true }, { status: 200 });
    await setAuthCookiesOnResponse(response, user.id);

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

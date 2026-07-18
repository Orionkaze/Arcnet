import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, setAuthCookiesOnResponse } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// A valid throwaway bcrypt hash (of a random string). When no matching account
// exists, we still run a bcrypt comparison against this so the not-found path
// takes the same ~time as a wrong-password path — closing a user-enumeration
// timing oracle. The result is discarded.
const DUMMY_HASH = "$2b$12$kYI490Ch3Fzurjpa6UHSQuu8WamdB6MhcFmi5w6G1OIHB7vEdZClK";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(`login_${ip}`, 5, 15 * 60 * 1000);
    
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

    // Per-email rate limit (in addition to the IP limiter above) to slow
    // credential-stuffing against a single account. Returns the same 429.
    const emailRateLimit = await checkRateLimit(
      `login_email_${email.toLowerCase()}`,
      10,
      15 * 60 * 1000,
    );
    if (!emailRateLimit.success) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in 15 minutes.` },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Compare the password BEFORE any account-state check so we never leak
    // whether an account exists or needs verification to someone who does not
    // know the password. "User not found" and "wrong password" return an
    // identical 401 so the two cases are indistinguishable.
    if (!user || !user.password) {
      // Perform a dummy bcrypt comparison so this path costs ~the same as a
      // wrong-password path. Prevents distinguishing "no such account" from
      // "wrong password" by response timing. Result intentionally discarded.
      await comparePassword(password, DUMMY_HASH);
      console.warn(
        JSON.stringify({
          evt: "login_failed",
          email: email.toLowerCase(),
          ts: new Date().toISOString(),
        })
      );
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.warn(
        JSON.stringify({
          evt: "login_failed",
          email: email.toLowerCase(),
          ts: new Date().toISOString(),
        })
      );
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Only after a correct password do we reveal verification state.
    if (!user.isVerified) {
      return NextResponse.json({ error: "Account not verified. Check your email." }, { status: 403 });
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const RESERVED_WORDS = ["admin", "arcnet", "support", "root", "system", "moderator"];

const usernameSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_.]+$/, "Only letters, numbers, underscores and dots allowed")
});

export async function POST(req: Request) {
  try {
    // Light IP limiter on this authenticated onboarding endpoint.
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const ipRateLimit = checkRateLimit(`setup_username_ip_${ip}`, 15, 15 * 60 * 1000);
    if (!ipRateLimit.success) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in 15 minutes.` },
        { status: 429 }
      );
    }

    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = usernameSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { username } = result.data;

    if (RESERVED_WORDS.includes(username.toLowerCase())) {
      return NextResponse.json({ error: "This username is reserved" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });

    if (existing && existing.id !== session.userId) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId as string },
      data: { username },
    });

    return NextResponse.json({ success: true, user: {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      isVerified: updatedUser.isVerified
    }}, { status: 200 });

  } catch (error) {
    console.error("Setup Username Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setAuthCookiesOnResponse } from "@/lib/auth";

const DEMO_EMAIL = "demo@caliber.dev";

/**
 * Auto-authenticates as the seeded demo user, skipping the login screen
 * entirely. Only reachable when NEXT_PUBLIC_DEMO_MODE=true, which is set
 * exclusively by `npm run demo` (see scripts/demo.mjs) — never in production.
 */
export async function POST() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Demo user not seeded. Run `npm run demo` to seed it." },
      { status: 404 }
    );
  }

  const response = NextResponse.json({ success: true });
  await setAuthCookiesOnResponse(response, user.id);
  return response;
}

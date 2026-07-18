import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST() {
  try {
    // If there's a valid session, bump the user's tokenVersion so every
    // outstanding refresh token for this user becomes stale (revocation).
    // No session → just clear cookies as before, don't error.
    const session = await getSession();
    if (session?.userId) {
      try {
        await prisma.user.update({
          where: { id: session.userId as string },
          data: { tokenVersion: { increment: 1 } },
        });
      } catch {
        // Best-effort: even if the increment fails, still clear cookies below.
      }
    }

    const response = NextResponse.json({ success: true }, { status: 200 });

    // Clear cookies with maxAge: 0 and path: "/"
    response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
    response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });

    return response;
  } catch (error) {
    console.error("Logout Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

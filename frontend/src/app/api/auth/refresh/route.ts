import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken, signToken } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      const response = NextResponse.json({ error: "No refresh token" }, { status: 401 });
      response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
      response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
      return response;
    }

    try {
      const payload = await verifyToken(refreshToken);

      if (!payload || !payload.userId) {
        const response = NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
        response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
        response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
        return response;
      }

      // Revocation gate: the user's current tokenVersion must match the one
      // embedded in the refresh token. Logout increments tokenVersion, which
      // makes every previously-issued refresh token stale.
      const user = await prisma.user.findUnique({
        where: { id: payload.userId as string },
        select: { id: true, tokenVersion: true },
      });

      if (!user || (payload.tokenVersion ?? 0) !== user.tokenVersion) {
        const response = NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
        response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
        response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
        return response;
      }

      const newAccessToken = await signToken(
        { userId: payload.userId, tokenVersion: user.tokenVersion },
        "15m",
      );

      const response = NextResponse.json({ success: true }, { status: 200 });
      response.cookies.set("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60, // 15 minutes
        path: "/",
      });
      return response;
    } catch {
      const response = NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
      response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
      response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
      return response;
    }
  } catch (error) {
    console.error("Refresh Token Error:", error);
    const response = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
    response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
    return response;
  }
}

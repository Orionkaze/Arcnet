import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

      const newAccessToken = await signToken({ userId: payload.userId }, "15m");

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

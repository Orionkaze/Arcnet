import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, signToken } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const payload = await verifyToken(refreshToken);

    if (!payload || !payload.userId) {
      cookieStore.set("access_token", "", { maxAge: 0, path: "/" });
      cookieStore.set("refresh_token", "", { maxAge: 0, path: "/" });
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    const newAccessToken = await signToken({ userId: payload.userId }, "15m");

    cookieStore.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

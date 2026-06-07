import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-key-for-arcnet-dev"
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: Record<string, unknown>, expiresIn: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function setAuthCookies(userId: string) {
  const accessToken = await signToken({ userId }, "15m");
  const refreshToken = await signToken({ userId }, "7d");

  const cookieStore = await cookies();

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60, // 15 minutes
    path: "/",
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}

const lastSeenUpdateCache = new Map<string, number>();

export async function getSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (accessToken) {
    const payload = await verifyToken(accessToken);
    if (payload && payload.userId) {
      const userId = payload.userId as string;
      const lastUpdate = lastSeenUpdateCache.get(userId) || 0;
      const now = Date.now();
      if (now - lastUpdate > 60000) {
        lastSeenUpdateCache.set(userId, now);
        prisma.user.update({
          where: { id: userId },
          data: { lastSeen: new Date() }
        }).catch(() => {});
      }
      return payload;
    }
  }

  // Handle refresh token logic if needed
  // For simplicity, we just rely on access_token, but in a real scenario
  // we'd rotate tokens here if access_token is expired but refresh_token is valid.

  return null;
}

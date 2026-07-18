import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable must be set in production");
}
const JWT_SECRET = new TextEncoder().encode(
  rawSecret || "dev-only-insecure-secret-do-not-use-in-prod",
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(
  payload: Record<string, unknown>,
  expiresIn: string,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    // Pin the algorithm to prevent alg-confusion attacks (e.g. "none" / alg swap).
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Set auth cookies using the `cookies()` API from next/headers.
 * Use this ONLY in Server Actions and Middleware — NOT in Route Handlers.
 */
export async function setAuthCookies(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  });
  const tokenVersion = dbUser?.tokenVersion ?? 0;

  const accessToken = await signToken({ userId, tokenVersion }, "15m");
  const refreshToken = await signToken({ userId, tokenVersion }, "7d");

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

/**
 * Set auth cookies on a NextResponse object.
 * Use this in Route Handlers (API routes) where `cookies()` cannot set cookies.
 */
export async function setAuthCookiesOnResponse(
  response: NextResponse,
  userId: string,
) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  });
  const tokenVersion = dbUser?.tokenVersion ?? 0;

  const accessToken = await signToken({ userId, tokenVersion }, "15m");
  const refreshToken = await signToken({ userId, tokenVersion }, "7d");

  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60,
    path: "/",
  });

  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}

const lastSeenUpdateCache = new Map<string, number>();
const userExistsCache = new Map<string, number>(); // userId → timestamp of last verified existence

/**
 * Verify the user actually exists in the database.
 * Uses a 60-second cache to avoid a DB query on every single request.
 * Returns false if the user has been deleted from the database.
 */
async function verifyUserExists(userId: string): Promise<boolean> {
  const now = Date.now();
  const lastCheck = userExistsCache.get(userId) || 0;

  // If we checked within the last 60 seconds, trust the cache
  if (now - lastCheck < 60000) {
    return true;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (user) {
      userExistsCache.set(userId, now);
      return true;
    } else {
      // User was deleted — clean up caches
      userExistsCache.delete(userId);
      lastSeenUpdateCache.delete(userId);
      return false;
    }
  } catch {
    // If DB is unreachable, fail open — let the downstream query handle it
    return true;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (accessToken) {
    const payload = await verifyToken(accessToken);
    if (payload && payload.userId) {
      const userId = payload.userId as string;

      // Issue #5 fix: verify user still exists in DB
      const exists = await verifyUserExists(userId);
      if (!exists) {
        return null;
      }

      const lastUpdate = lastSeenUpdateCache.get(userId) || 0;
      const now = Date.now();
      if (now - lastUpdate > 60000) {
        lastSeenUpdateCache.set(userId, now);
        prisma.user
          .update({
            where: { id: userId },
            data: { lastSeen: new Date() },
          })
          .catch(() => {});
      }
      return payload;
    }
  }

  // Access token expired or missing — try to rotate using refresh token
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (refreshToken) {
    const payload = await verifyToken(refreshToken);
    if (payload && payload.userId) {
      // Issue #5 fix: verify user still exists in DB
      const exists = await verifyUserExists(payload.userId as string);
      if (!exists) {
        return null;
      }

      // Refresh token is valid — issue a new access token.
      // Carry the token version forward (default 0 for older tokens).
      const newAccessToken = await signToken(
        { userId: payload.userId, tokenVersion: payload.tokenVersion ?? 0 },
        "15m",
      );

      // Issue #3 fix: cookies().set() can throw in Route Handlers.
      // Wrap in try-catch so the session is still returned even if
      // the cookie can't be refreshed in this context.
      try {
        cookieStore.set("access_token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60,
          path: "/",
        });
      } catch {
        // In Route Handlers, cookies cannot be set directly.
        // The session is still valid via the refresh token — the cookie
        // will be refreshed on the next Server Action or page navigation.
      }

      return payload;
    }
  }

  return null;
}

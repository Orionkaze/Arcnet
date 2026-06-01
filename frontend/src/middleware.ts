import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Auth pages that unauthenticated users can access
  const isAuthPage =
    path === "/login" ||
    path === "/signup" ||
    path === "/forgot-password" ||
    path === "/reset-password" ||
    path === "/verify-email";

  // Pages that require auth but are part of the onboarding flow
  const isOnboardingPage =
    path === "/setup-username" ||
    path === "/setup-avatar";

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const hasSession = !!((accessToken && accessToken !== "") || (refreshToken && refreshToken !== ""));

  // Redirect logged-in users away from auth pages
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  // Redirect unauthenticated users to login (except auth pages, onboarding, profile pages, and API routes)
  if (!isAuthPage && !isOnboardingPage && !path.startsWith("/profile/") && !hasSession && !path.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

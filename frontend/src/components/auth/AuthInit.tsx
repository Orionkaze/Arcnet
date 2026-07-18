"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";

// Set only by `npm run demo` (see scripts/demo.mjs), never in production.
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function AuthInit() {
  const { checkAuth, isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const demoLoginAttempted = useRef(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) return;

    const isExactPublicPath = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"].includes(pathname);
    const isProfilePath = pathname.startsWith("/profile/");
    const isOnboardingPath = ["/setup-username", "/setup-avatar"].includes(pathname);
    // Pages that are public to view but must NOT bounce logged-in users to home
    // (kept separate from isExactPublicPath, which does that bounce). Mirrors the
    // middleware's public-page allowlist so /latest is reachable while logged out.
    const isPublicViewablePath = pathname === "/latest";

    if (!isAuthenticated) {
      // Demo mode: there's no login screen — silently authenticate as the
      // seeded demo user the first time we see an unauthenticated session,
      // instead of ever redirecting to /login.
      if (DEMO_MODE && !demoLoginAttempted.current) {
        demoLoginAttempted.current = true;
        fetch("/api/auth/demo-login", { method: "POST" })
          .then(() => checkAuth())
          .catch(() => {});
        return;
      }
      // Unauthenticated users can access auth pages, profile pages, and public-viewable pages
      if (!DEMO_MODE && !isExactPublicPath && !isProfilePath && !isPublicViewablePath) {
        router.push("/login");
      }
    } else {
      // Authenticated users
      if (user && !user.isOnboarded) {
        // If not onboarded, redirect to onboarding steps if they are not already there
        if (!isOnboardingPath) {
          if (!user.username) {
            router.push("/setup-username");
          } else {
            router.push("/setup-avatar");
          }
        }
      } else {
        // Onboarded users should be redirected away from auth pages (login/signup) to home
        if (isExactPublicPath) {
          router.push("/");
        }
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  return null;
}

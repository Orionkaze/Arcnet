"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";

export function AuthInit() {
  const { checkAuth, isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

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
      // Unauthenticated users can access auth pages, profile pages, and public-viewable pages
      if (!isExactPublicPath && !isProfilePath && !isPublicViewablePath) {
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

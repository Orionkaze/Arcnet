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
    const isPublicPath = isExactPublicPath || isProfilePath;
    const isOnboardingPath = ["/setup-username", "/setup-avatar"].includes(pathname);

    if (!isAuthenticated && !isPublicPath && !isOnboardingPath) {
      router.push("/login");
    } else if (isAuthenticated && isPublicPath) {
      router.push("/");
    } else if (isAuthenticated && user && !user.isOnboarded && !isOnboardingPath) {
      // User hasn't completed onboarding — redirect to appropriate step
      if (!user.username) {
        router.push("/setup-username");
      } else {
        router.push("/setup-avatar");
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  return null;
}

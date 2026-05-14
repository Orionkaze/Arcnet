import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

const AUTH_PAGES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export function useAuthGuard() {
  const { user, isAuthenticated, isLoading, setLoading, setAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setAuth(data.user);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to check session", err);
        setLoading(false);
      }
    };

    if (isLoading && !isAuthenticated) {
      checkSession();
    }
  }, [isLoading, isAuthenticated, setAuth, setLoading]);

  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = AUTH_PAGES.includes(pathname);

    if (!isAuthenticated && !isAuthPage) {
      // Setup pages and app home are protected
      if (pathname.startsWith("/setup") || pathname === "/") {
        router.push("/login");
      }
    } else if (isAuthenticated && isAuthPage) {
      // Don't show login/signup to authenticated users
      router.push("/");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return { user, isAuthenticated, isLoading };
}

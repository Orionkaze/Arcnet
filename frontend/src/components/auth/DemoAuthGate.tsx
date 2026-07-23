"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

// Set only by `npm run demo` (see scripts/demo.mjs), never in production.
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Safety valve: if auto-login never lands, show the app anyway rather than
// leaving the visitor staring at a spinner forever.
const MAX_WAIT_MS = 5000;

/**
 * In demo mode there is no login screen — AuthInit silently authenticates every
 * visitor as the seeded demo user. That POST is asynchronous, so without this
 * gate a page's first authed fetch (e.g. the home feed) can fire before the
 * session cookie exists and fail with a 401 that never retries.
 *
 * Holding the shell until the session resolves fixes that race for every page
 * at once. Outside demo mode this renders children immediately and is inert.
 */
export function DemoAuthGate({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (!DEMO_MODE) return;
    const timer = setTimeout(() => setWaited(true), MAX_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!DEMO_MODE || isAuthenticated || waited) return <>{children}</>;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--c-bg)",
        color: "#10B981",
        fontFamily: "var(--font-manrope), sans-serif",
        fontSize: "0.8rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      Loading Caliber…
    </div>
  );
}

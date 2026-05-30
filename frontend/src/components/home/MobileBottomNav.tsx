"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const getActiveState = () => {
    if (pathname === "/") return "home";
    if (pathname.includes("/game-jams")) return "jams";
    if (pathname.includes("/find-team")) return "team";
    if (pathname.includes("/notifications")) return "notif";
    if (pathname.startsWith("/profile/")) return "profile";
    return "";
  };

  const active = getActiveState();

  return (
    <nav className="mobile-bottom-nav">
      {/* Home */}
      <Link
        href="/"
        className={`mobile-nav-btn bottom-nav-btn ${active === "home" ? "active" : ""}`}
        aria-label="Home"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
      </Link>

      {/* Game Jams — Trophy */}
      <Link
        href="/ecosystem/game-jams"
        className={`mobile-nav-btn bottom-nav-btn ${active === "jams" ? "active" : ""}`}
        aria-label="Game Jams"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H3a1 1 0 01-1-1V5a1 1 0 011-1h3" />
          <path d="M18 9h3a1 1 0 001-1V5a1 1 0 00-1-1h-3" />
          <path d="M6 4h12v6a6 6 0 01-12 0V4z" />
          <path d="M12 16v2" />
          <path d="M8 22h8" />
          <path d="M8 22v-4M16 22v-4" />
        </svg>
      </Link>

      {/* Find Team — People */}
      <Link
        href="/ecosystem/find-team"
        className={`mobile-nav-btn bottom-nav-btn ${active === "team" ? "active" : ""}`}
        aria-label="Find Team"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      </Link>

      {/* Notifications — Bell */}
      <Link
        href="/notifications"
        className={`mobile-nav-btn bottom-nav-btn ${active === "notif" ? "active" : ""}`}
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      </Link>

      {/* Profile — User */}
      <Link
        href={user ? `/profile/${user.username}` : "/login"}
        className={`mobile-nav-btn bottom-nav-btn ${active === "profile" ? "active" : ""}`}
        aria-label="Profile"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>
    </nav>
  );
}

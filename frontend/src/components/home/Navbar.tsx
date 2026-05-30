"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";

interface NavbarProps {
  onMenuToggle?: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const [activeNav, setActiveNav] = React.useState<"home" | "latest">("home");
  const { user } = useAuthStore();

  return (
    <nav className="navbar">
      {/* Left — Logo */}
      <div className="navbar-left">
        <Link href="/" className="navbar-logo">
          <span className="logo-arc">ARC</span>
          <span className="logo-net">NET</span>
        </Link>
      </div>

      {/* Center — Nav links */}
      <div className="navbar-center">
        <button
          className={`navbar-link ${activeNav === "home" ? "active" : ""}`}
          onClick={() => setActiveNav("home")}
        >
          {/* House icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
            <path d="M9 21V12h6v9" />
          </svg>
          <span className="nav-text">Home</span>
        </button>

        <button
          className={`navbar-link ${activeNav === "latest" ? "active" : ""}`}
          onClick={() => setActiveNav("latest")}
        >
          {/* Clock icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="nav-text">Latest</span>
        </button>
      </div>

      {/* Right — Actions */}
      <div className="navbar-right">
        {/* Chat bubble icon */}
        <button className="navbar-icon-btn" aria-label="Messages">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
          </svg>
        </button>

        {/* Bell icon */}
        <button className="navbar-icon-btn" aria-label="Notifications">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </button>

        {/* Vertical divider */}
        <span className="navbar-divider" />

        {/* User icon / Avatar */}
        {user ? (
          <Link href={`/profile/${user.username}`} className="navbar-avatar" aria-label="Profile">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                width={36}
                height={36}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span>{`${user.firstName[0]}${user.lastName[0]}`.toUpperCase()}</span>
            )}
          </Link>
        ) : (
          <Link href="/login" className="navbar-icon-btn" aria-label="Profile">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </Link>
        )}

        {/* Hamburger — mobile only */}
        <button
          className="hamburger-btn"
          aria-label="Open menu"
          onClick={onMenuToggle}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </nav>
  );
}

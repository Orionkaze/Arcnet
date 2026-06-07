"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface NavbarProps {
  onMenuToggle?: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchUnreadCount = React.useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn("Error fetching unread count:", err);
    }
  }, [user]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchUnreadCount();
    }, 0);
    if (!user) return () => clearTimeout(timer);

    const interval = setInterval(fetchUnreadCount, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [user, fetchUnreadCount]);

  const handleNotificationClick = async () => {
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/mark-read", { method: "POST" });
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

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
        <Link
          href="/"
          className={`navbar-link ${isActive("/") ? "active" : ""}`}
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
        </Link>

        <Link
          href="/latest"
          className={`navbar-link ${isActive("/latest") ? "active" : ""}`}
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
        </Link>
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
        <button
          className="navbar-icon-btn"
          aria-label="Notifications"
          onClick={handleNotificationClick}
          style={{ position: "relative" }}
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
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "8px",
                height: "8px",
                backgroundColor: "#FF4D4D",
                borderRadius: "50%",
                boxShadow: "0 0 4px #FF4D4D",
              }}
            />
          )}
        </button>

        {/* Vertical divider */}
        <span className="navbar-divider" />

        {/* User icon / Avatar */}
        {user ? (
          <Link href={`/profile/${user.username}`} className="navbar-avatar" aria-label="Profile">
            {user.avatar ? (
              user.avatar.startsWith("data:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <Image
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover rounded-full"
                />
              )
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

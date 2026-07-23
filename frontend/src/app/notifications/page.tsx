"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import "../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuthStore } from "@/store/useAuthStore";

interface NotificationUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string | null;
  avatar: string | null;
  role: string | null;
}

interface NotificationItem {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  fromUser: NotificationUser | null;
  post: { id: string; excerpt: string } | null;
}

// Human-readable verb + icon per notification type.
const TYPE_META: Record<
  string,
  { verb: string; color: string; icon: React.ReactNode }
> = {
  follow: {
    verb: "started following you",
    color: "#10B981",
    icon: (
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 7a4 4 0 108 0 4 4 0 00-8 0M19 8v6M22 11h-6" />
    ),
  },
  like: {
    verb: "liked your post",
    color: "#FF4D6D",
    icon: (
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    ),
  },
  comment: {
    verb: "commented on your post",
    color: "#10B981",
    icon: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />,
  },
  repost: {
    verb: "reposted your post",
    color: "#7CFF6B",
    icon: <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" />,
  },
  share: {
    verb: "shared a post with you",
    color: "#10B981",
    icon: (
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    ),
  },
  hub_request: {
    verb: "requested to join your hub",
    color: "#FFB000",
    icon: (
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 108 0 4 4 0 00-8 0M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    ),
  },
  hub_request_approved: {
    verb: "approved your request to join a hub",
    color: "#22C55E",
    icon: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>
    ),
  },
  hub_request_rejected: {
    verb: "declined your request to join a hub",
    color: "#FF4D6D",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </>
    ),
  },
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.floor((Date.now() - then) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsPage() {
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const showErrorToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 3000);
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.status === 401) {
        setItems([]);
        return;
      }
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      setItems(data.notifications || []);
      // Mark everything read now that the user is viewing them.
      fetch("/api/notifications/mark-read", { method: "POST" }).catch(() => {});
    } catch (err) {
      console.error(err);
      showErrorToast("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAuth, fetchNotifications]);

  return (
    <div className="home-layout">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
      <div className="home-content relative">
        <LeftSidebar />

        <main className="center-feed">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-6">
            <span className="section-label">ACTIVITY</span>
            <h1 className="font-chakra text-2xl text-white font-bold uppercase tracking-wider">
              Notifications
            </h1>
            <p className="font-inter text-sm text-[var(--c-text-muted)]">
              Follows, reactions, and hub activity from across the Caliber ecosystem.
            </p>
          </div>

          {errorToast && (
            <div className="mb-4 bg-red-500 text-white font-bold font-chakra text-xs py-2 px-3 rounded shadow-lg inline-block">
              {errorToast}
            </div>
          )}

          {/* List */}
          {loading && items.length === 0 ? (
            <div className="flex flex-col gap-3">
              <div className="skeleton-card skeleton-shimmer" style={{ height: "72px" }} />
              <div className="skeleton-card skeleton-shimmer" style={{ height: "72px" }} />
              <div className="skeleton-card skeleton-shimmer" style={{ height: "72px" }} />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </div>
              <div className="text-white font-chakra font-bold text-sm mb-1">
                You&apos;re all caught up
              </div>
              <div className="text-[var(--c-text-muted)] font-inter text-sm">
                New follows, reactions, and hub requests will show up here.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((n) => {
                const meta = TYPE_META[n.type] || {
                  verb: "sent you a notification",
                  color: "var(--c-text-muted)",
                  icon: <circle cx="12" cy="12" r="9" />,
                };
                const from = n.fromUser;
                const name = from
                  ? `${from.firstName} ${from.lastName}`.trim()
                  : "Someone";
                const initial = from ? from.firstName.charAt(0).toUpperCase() : "?";

                return (
                  <div
                    key={n.id}
                    className={`notif-card ${n.isRead ? "" : "unread"}`}
                  >
                    <div className="flex gap-3 items-start">
                      {/* Avatar */}
                      {from?.username ? (
                        <Link
                          href={`/profile/${from.username}`}
                          className="flex-shrink-0 block"
                        >
                          <div className="notif-avatar">
                            {from.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={from.avatar}
                                alt={name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              initial
                            )}
                          </div>
                        </Link>
                      ) : (
                        <div className="flex-shrink-0">
                          <div className="notif-avatar">{initial}</div>
                        </div>
                      )}

                      {/* Type icon badge */}
                      <div
                        className="notif-type-icon flex-shrink-0"
                        style={{ borderColor: meta.color }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={meta.color}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {meta.icon}
                        </svg>
                      </div>

                      {/* Message */}
                      <div className="flex-grow min-w-0">
                        <p className="font-inter text-sm text-white leading-snug">
                          {from?.username ? (
                            <Link
                              href={`/profile/${from.username}`}
                              className="font-bold hover:text-[#10B981] transition-colors"
                            >
                              {name}
                            </Link>
                          ) : (
                            <span className="font-bold">{name}</span>
                          )}{" "}
                          <span className="text-[var(--c-text-muted)]">{meta.verb}</span>
                        </p>
                        {n.post?.excerpt && (
                          <p className="font-inter text-xs text-[#8A9099] mt-1 truncate">
                            &ldquo;{n.post.excerpt}&rdquo;
                          </p>
                        )}
                        <span className="font-inter text-[11px] text-[#6B7280] mt-1 block">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>

                      {!n.isRead && <span className="notif-dot flex-shrink-0" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <RightPanel />
      </div>
      <MobileBottomNav />
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <style jsx>{`
        .section-label {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: rgba(16, 185, 129, 0.6);
        }
        .notif-card {
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: 10px;
          padding: 0.85rem 1rem;
          transition: border-color 0.2s, background 0.2s;
        }
        .notif-card:hover {
          border-color: rgba(16, 185, 129, 0.3);
        }
        .notif-card.unread {
          background: rgba(16, 185, 129, 0.04);
          border-color: rgba(16, 185, 129, 0.25);
        }
        .notif-avatar {
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          background: var(--c-border);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
          border: 1px solid var(--c-border);
          transition: border-color 0.2s;
        }
        .notif-avatar:hover {
          border-color: #10B981;
        }
        .notif-type-icon {
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          background: var(--c-surface);
          border: 1.5px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
          margin-left: -18px;
          align-self: flex-end;
        }
        .notif-dot {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: #10B981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
}

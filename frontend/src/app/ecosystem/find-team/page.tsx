"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import "../../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuthStore } from "@/store/useAuthStore";

interface Creator {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string | null;
  role: string | null;
  skills: string | null;
  isFollowing: boolean;
}

export default function FindTeamPage() {
  const { user, checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const showErrorToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 3000);
  };

  const fetchCreators = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to load creators");
      const data = await res.json();
      setCreators(data.users || []);
    } catch (err) {
      console.error(err);
      showErrorToast("Could not load creators.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    fetchCreators(val);
  };

  const handleFollowToggle = async (creatorId: string, username: string) => {
    if (!user) {
      showErrorToast("Please log in to follow creators.");
      return;
    }

    setCreators((prev) =>
      prev.map((c) =>
        c.id === creatorId ? { ...c, isFollowing: !c.isFollowing } : c
      )
    );

    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: "POST" });
      if (!res.ok) throw new Error("Follow request failed");
      const data = await res.json();
      
      // Update follow state based on response
      setCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId ? { ...c, isFollowing: data.following } : c
        )
      );
    } catch {
      // Revert follow state
      setCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId ? { ...c, isFollowing: !c.isFollowing } : c
        )
      );
      showErrorToast("Could not complete follow request.");
    }
  };

  useEffect(() => {
    checkAuth();
    const timer = setTimeout(() => {
      fetchCreators();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAuth, fetchCreators]);

  return (
    <div className="home-layout">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
      <div className="home-content relative">
        <LeftSidebar />

        <main className="center-feed">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-6">
            <span className="section-label">ECOSYSTEM</span>
            <h1 className="font-chakra text-2xl text-white font-bold uppercase tracking-wider">
              Find Teammates
            </h1>
            <p className="font-inter text-sm text-[var(--c-text-muted)]">
              Browse talent, discover skills, and form your team for competitions and case prep.
            </p>
          </div>

          {/* Search bar */}
          <div className="mb-6 relative">
            {errorToast && (
              <div className="absolute top-[-44px] right-0 bg-red-500 text-white font-bold font-chakra text-xs py-1.5 px-3 rounded shadow-lg z-30">
                {errorToast}
              </div>
            )}
            <input
              type="text"
              placeholder="Search by name, username, or skills (e.g. SQL, Valuation, Product)..."
              value={search}
              onChange={handleSearchChange}
              className="w-full bg-[var(--c-surface)] border border-[var(--c-border)] text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#10B981] transition-colors font-inter"
              style={{ height: "44px" }}
            />
          </div>

          {/* Creators Grid */}
          {loading && creators.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="skeleton-card skeleton-shimmer" style={{ height: "140px" }} />
              <div className="skeleton-card skeleton-shimmer" style={{ height: "140px" }} />
              <div className="skeleton-card skeleton-shimmer" style={{ height: "140px" }} />
              <div className="skeleton-card skeleton-shimmer" style={{ height: "140px" }} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creators.map((creator) => (
                <div key={creator.id} className="creator-card">
                  <div className="flex gap-4 items-start">
                    {/* Avatar */}
                    <Link href={`/profile/${creator.username}`} className="flex-shrink-0 cursor-pointer block">
                      <div className="w-12 h-12 rounded-full bg-[var(--c-border)] overflow-hidden flex items-center justify-center font-bold text-lg border border-[var(--c-border)] hover:border-[#10B981] transition-colors">
                        {creator.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={creator.avatar} alt={creator.firstName} className="w-full h-full object-cover" />
                        ) : (
                          creator.firstName.charAt(0).toUpperCase()
                        )}
                      </div>
                    </Link>

                    {/* Meta info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <Link href={`/profile/${creator.username}`} className="truncate pr-2 cursor-pointer hover:opacity-80 transition-opacity block">
                          <h3 className="font-inter text-sm font-bold text-white leading-tight truncate">
                            {creator.firstName} {creator.lastName}
                          </h3>
                          <span className="font-inter text-xs text-[var(--c-text-muted)]">
                            @{creator.username}
                          </span>
                        </Link>
                        {user && user.id !== creator.id && (
                          <button
                            onClick={() => handleFollowToggle(creator.id, creator.username)}
                            className={`follow-btn flex-shrink-0 ${
                              creator.isFollowing ? "following" : ""
                            }`}
                            style={{
                              borderColor: creator.isFollowing ? "var(--c-border)" : "#10B981",
                              color: creator.isFollowing ? "var(--c-text-muted)" : "#10B981",
                            }}
                          >
                            {creator.isFollowing ? "Following" : "+ Follow"}
                          </button>
                        )}
                      </div>

                      {/* Role & Skills */}
                      <p className="font-chakra text-xs text-[#10B981] uppercase tracking-wide mt-1.5 font-bold truncate">
                        {creator.role || "Caliber Member"}
                      </p>

                      {creator.skills && (
                        <div className="flex flex-wrap gap-1.5 mt-2 max-h-12 overflow-hidden">
                          {creator.skills
                            .split(",")
                            .map((skill: string) => skill.trim())
                            .filter(Boolean)
                            .map((skill: string, sIdx: number) => (
                              <span
                                key={sIdx}
                                className="text-[10px] font-inter bg-[var(--c-border)] text-white px-2 py-0.5 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty search state */}
          {!loading && creators.length === 0 && (
            <div className="text-center py-16">
              <div className="text-[var(--c-text-muted)] font-inter text-sm">
                No creators found matching &quot;{search}&quot;.
              </div>
            </div>
          )}
        </main>

        <RightPanel />
      </div>
      <MobileBottomNav />
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <style jsx>{`
        .section-label {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: rgba(16, 185, 129, 0.6);
        }
        .creator-card {
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: 10px;
          padding: 1rem;
          transition: border-color 0.2s;
        }
        .creator-card:hover {
          border-color: rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </div>
  );
}

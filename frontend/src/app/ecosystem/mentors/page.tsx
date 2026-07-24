"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import "../../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuthStore } from "@/store/useAuthStore";
import MentorListingModal from "@/components/ecosystem/MentorListingModal";

interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  company: string;
  specialty: string;
  years: number;
  bio: string;
  expertise: string[];
  rating: number;
  sessions: number;
  price: number;
  verified: boolean;
  requested: boolean;
  mine: boolean;
}

const SPECIALTIES = ["All", "Consulting", "Finance", "Product", "Data", "Aptitude"];

export default function MentorsPage() {
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [activeSpecialty, setActiveSpecialty] = useState("All");

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);
  const [isListingOpen, setIsListingOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mentors");
      if (!res.ok) throw new Error("Failed to load mentors");
      const data = await res.json();
      setMentors(data.mentors ?? []);
    } catch {
      setError("Couldn't load mentors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred so the initial setState isn't synchronous in the effect body
    // (project lint rule).
    const t = setTimeout(() => fetchMentors(), 0);
    return () => clearTimeout(t);
  }, [fetchMentors]);

  // The viewer's own listing, if they have one.
  const myListing = useMemo(() => mentors.find((m) => m.mine) ?? null, [mentors]);

  const handleRemoveListing = async (mentor: Mentor) => {
    if (!window.confirm("Remove your mentor listing?")) return;
    setBookError(null);
    try {
      const res = await fetch(`/api/mentors/${mentor.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setBookError(data.error || "Could not remove your listing.");
        return;
      }
      fetchMentors();
    } catch {
      setBookError("Could not remove your listing.");
    }
  };

  const handleBook = async (mentor: Mentor) => {
    setBookError(null);
    const nextRequested = !mentor.requested;
    // Optimistic update — revert on failure.
    setMentors((list) =>
      list.map((m) => (m.id === mentor.id ? { ...m, requested: nextRequested } : m))
    );
    try {
      const res = await fetch(`/api/mentors/${mentor.id}/book`, { method: "POST" });
      if (res.status === 401) {
        setMentors((list) =>
          list.map((m) => (m.id === mentor.id ? { ...m, requested: mentor.requested } : m))
        );
        setBookError("Log in to book.");
        return;
      }
      if (!res.ok) throw new Error("Booking failed");
      const data = await res.json();
      setMentors((list) =>
        list.map((m) => (m.id === mentor.id ? { ...m, requested: data.requested } : m))
      );
    } catch {
      setMentors((list) =>
        list.map((m) => (m.id === mentor.id ? { ...m, requested: mentor.requested } : m))
      );
    }
  };

  const filteredMentors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mentors.filter((m) => {
      const matchesSpecialty =
        activeSpecialty === "All" || m.specialty === activeSpecialty;
      if (!matchesSpecialty) return false;
      if (!q) return true;
      const haystack = [
        m.firstName,
        m.lastName,
        m.role,
        m.company,
        m.specialty,
        ...m.expertise,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, activeSpecialty, mentors]);

  return (
    <div className="home-layout">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
      <div className="home-content relative">
        <LeftSidebar />

        <main className="center-feed">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-6">
            <span className="section-label">ECOSYSTEM</span>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="font-chakra text-2xl text-white font-bold uppercase tracking-wider">
                Find Mentors
              </h1>
              <button
                onClick={() => setIsListingOpen(true)}
                className="book-btn flex-shrink-0"
              >
                {myListing ? "Edit your listing" : "+ Become a Mentor"}
              </button>
            </div>
            <p className="font-inter text-sm text-[var(--c-text-muted)]">
              Browse verified professionals across consulting, finance, product,
              data, and aptitude &mdash; then book a session.
            </p>
          </div>

          {/* Search bar */}
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Search by name or expertise (e.g. DCF, Case Structuring, SQL)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--c-surface-2)] border border-[var(--c-border)] text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#10B981] transition-colors font-inter"
              style={{ height: "44px" }}
            />
          </div>

          {/* Specialty filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {SPECIALTIES.map((spec) => (
              <button
                key={spec}
                onClick={() => setActiveSpecialty(spec)}
                className={`specialty-pill ${
                  activeSpecialty === spec ? "active" : ""
                }`}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Booking auth notice */}
          {bookError && (
            <div className="mb-4 text-sm font-inter text-[#10B981]">
              {bookError}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="text-center py-16">
              <div className="text-[var(--c-text-muted)] font-inter text-sm">
                Loading mentors&hellip;
              </div>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="text-center py-16">
              <div className="text-[var(--c-text-muted)] font-inter text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Empty state (no mentors at all) */}
          {!loading && !error && mentors.length === 0 && (
            <div className="text-center py-16">
              <div className="text-[var(--c-text-muted)] font-inter text-sm">
                No mentors yet.
              </div>
            </div>
          )}

          {/* Mentors Grid */}
          {!loading && !error && mentors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMentors.map((mentor) => (
              <div key={mentor.id} className="mentor-card flex flex-col">
                <div className="flex gap-4 items-start">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[var(--c-border)] overflow-hidden flex items-center justify-center font-bold text-lg text-white border border-[var(--c-border)]">
                      {mentor.firstName.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-inter text-sm font-bold text-white leading-tight truncate">
                        {mentor.firstName} {mentor.lastName}
                      </h3>
                      {mentor.verified && (
                        <span
                          title="Verified professional"
                          className="flex-shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full"
                          style={{ background: "rgba(16, 185, 129,0.12)" }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </span>
                      )}
                    </div>

                    <p className="font-chakra text-xs text-[#10B981] uppercase tracking-wide mt-1 font-bold truncate">
                      {mentor.role} @ {mentor.company}
                    </p>
                    <span className="font-inter text-[11px] text-[var(--c-text-muted)]">
                      {mentor.years} yrs experience
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <p className="font-inter text-xs text-[var(--c-text-muted)] mt-3 leading-relaxed">
                  {mentor.bio}
                </p>

                {/* Expertise tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {mentor.expertise.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-inter bg-[var(--c-border)] text-white px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Rating + price + CTA */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--c-border)]">
                  <div className="flex flex-col">
                    <span className="font-inter text-xs text-white">
                      <span className="text-[#10B981]">&#9733;</span> {mentor.rating.toFixed(1)}{" "}
                      <span className="text-[var(--c-text-muted)]">({mentor.sessions} sessions)</span>
                    </span>
                    <span className="font-chakra text-xs text-white font-bold mt-0.5">
                      &#8377;{mentor.price.toLocaleString("en-IN")} / 45 min
                    </span>
                  </div>
                  {mentor.mine ? (
                    // You can't book yourself — offer listing management instead.
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-chakra text-[11px] uppercase tracking-wider text-[#10B981]">
                        Your listing
                      </span>
                      <button
                        onClick={() => handleRemoveListing(mentor)}
                        className="font-inter text-xs text-[#FF4D4D] hover:underline"
                      >
                        Remove listing
                      </button>
                    </div>
                  ) : (
                    <button
                      className="book-btn"
                      onClick={() => handleBook(mentor)}
                    >
                      {mentor.requested ? "Session Requested ✓" : "Book a Session"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Empty state (no filter matches) */}
          {!loading && !error && mentors.length > 0 && filteredMentors.length === 0 && (
            <div className="text-center py-16">
              <div className="text-[var(--c-text-muted)] font-inter text-sm">
                No mentors found matching &quot;{search}&quot;.
              </div>
            </div>
          )}
        </main>

        <RightPanel />
      </div>
      <MobileBottomNav />
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <MentorListingModal
        open={isListingOpen}
        onClose={() => setIsListingOpen(false)}
        existing={myListing}
        onSaved={fetchMentors}
      />

      <style jsx>{`
        .section-label {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: rgba(16, 185, 129, 0.6);
        }
        .mentor-card {
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: 10px;
          padding: 1rem;
          transition: border-color 0.2s;
        }
        .mentor-card:hover {
          border-color: rgba(16, 185, 129, 0.3);
        }
        .specialty-pill {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--c-text-muted);
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: 9999px;
          padding: 6px 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .specialty-pill:hover {
          border-color: rgba(16, 185, 129, 0.3);
          color: var(--c-text);
        }
        .specialty-pill.active {
          color: #10B981;
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.08);
        }
        .book-btn {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #0a0e14;
          background: #10B981;
          border: none;
          border-radius: 8px;
          padding: 8px 14px;
          cursor: pointer;
          flex-shrink: 0;
          transition: filter 0.2s, box-shadow 0.2s;
        }
        .book-btn:hover {
          filter: brightness(1.1);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
}

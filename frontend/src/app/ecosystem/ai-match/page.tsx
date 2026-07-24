"use client";

import React, { useState, useEffect } from "react";
import "../../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuthStore } from "@/store/useAuthStore";

interface PreviewFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const PREVIEW_FEATURES: PreviewFeature[] = [
  {
    title: "Skill-Graph Matching",
    description: "Maps your skills and strengths to complementary peers.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="2.5"></circle>
        <circle cx="18" cy="6" r="2.5"></circle>
        <circle cx="12" cy="18" r="2.5"></circle>
        <line x1="7.7" y1="7.7" x2="10.3" y2="16.3"></line>
        <line x1="16.3" y1="7.7" x2="13.7" y2="16.3"></line>
        <line x1="8.5" y1="6" x2="15.5" y2="6"></line>
      </svg>
    ),
  },
  {
    title: "Smart Competition Squads",
    description: "Auto-builds balanced teams for your next competition.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
  },
  {
    title: "Mentor Recommendations",
    description: "Surfaces experienced professionals aligned to your goals.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z"></path>
      </svg>
    ),
  },
];

export default function AiMatchPage() {
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showSuccessToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleNotifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: "ai-match", email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showSuccessToast(data.error || "Could not add you — try again.");
        return;
      }
      showSuccessToast(data.alreadyOnList ? "You're already on the list!" : "You're on the list!");
      setEmail("");
    } catch {
      showSuccessToast("Could not add you — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
              AI Match
            </h1>
            <p className="font-inter text-sm text-[var(--c-text-muted)]">
              Intelligent matchmaking for skill-building collaboration — coming soon.
            </p>
          </div>

          {/* Coming Soon Panel */}
          <div className="coming-soon-panel">
            {/* Spark icon with glow */}
            <div className="spark-wrap">
              <svg
                className="spark-icon"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z"></path>
              </svg>
            </div>

            {/* Coming Soon pill */}
            <span className="coming-soon-pill">Coming Soon</span>

            {/* Headline + copy */}
            <h2 className="font-chakra text-xl md:text-2xl text-white font-bold uppercase tracking-wide mt-4">
              AI-Powered Team Matching
            </h2>
            <p className="font-inter text-sm text-[var(--c-text-muted)] max-w-[520px] mx-auto mt-3 leading-relaxed">
              AI Match will analyze your skills, track record, and goals to
              auto-suggest ideal teammates, competitions, and mentors. Think of it as
              matchmaking for skill-building — the right people for the
              prep you actually want to do.
            </p>

            {/* Feature preview grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-left">
              {PREVIEW_FEATURES.map((feature) => (
                <div key={feature.title} className="preview-card">
                  <div className="preview-icon">{feature.icon}</div>
                  <h3 className="font-chakra text-sm text-white font-bold uppercase tracking-wide mt-3">
                    {feature.title}
                  </h3>
                  <p className="font-inter text-xs text-[var(--c-text-muted)] mt-1.5 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Notify me */}
            <div className="notify-wrap relative">
              {successToast && (
                <div className="absolute top-[-44px] left-1/2 -translate-x-1/2 bg-[#10B981] text-[#0A0E14] font-bold font-chakra text-xs py-1.5 px-3 rounded shadow-lg z-30 whitespace-nowrap">
                  {successToast}
                </div>
              )}
              <p className="font-inter text-xs text-[var(--c-text-muted)] mb-3">
                Be the first to know when AI Match goes live.
              </p>
              <form
                onSubmit={handleNotifySubmit}
                className="flex flex-col sm:flex-row gap-2.5 justify-center max-w-[440px] mx-auto"
              >
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                  className="flex-grow bg-[var(--c-surface-2)] border border-[var(--c-border)] text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#10B981] transition-colors font-inter disabled:opacity-60"
                  style={{ height: "44px" }}
                />
                <button type="submit" className="notify-btn" disabled={submitting}>
                  {submitting ? "Adding…" : "Notify Me"}
                </button>
              </form>
            </div>
          </div>
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
        .coming-soon-panel {
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: 14px;
          padding: 3rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          /* .center-feed is a fixed-height flex column; without this the
             panel is shrunk by flex and overflow:hidden clips the form. */
          flex-shrink: 0;
        }
        .coming-soon-panel::before {
          content: "";
          position: absolute;
          top: -40%;
          left: 50%;
          transform: translateX(-50%);
          width: 420px;
          height: 420px;
          background: radial-gradient(
            circle,
            rgba(16, 185, 129, 0.08) 0%,
            rgba(16, 185, 129, 0) 70%
          );
          pointer-events: none;
        }
        .spark-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 104px;
          height: 104px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.2);
          position: relative;
          z-index: 1;
        }
        .spark-icon {
          filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.55));
          animation: sparkPulse 2.8s ease-in-out infinite;
        }
        @keyframes sparkPulse {
          0%,
          100% {
            filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.45));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.8));
          }
        }
        .coming-soon-pill {
          display: inline-block;
          margin-top: 1.5rem;
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #10B981;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.35);
          padding: 0.4rem 1rem;
          border-radius: 999px;
          position: relative;
          z-index: 1;
        }
        .preview-card {
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: 10px;
          padding: 1.25rem;
          transition: border-color 0.2s;
        }
        .preview-card:hover {
          border-color: rgba(16, 185, 129, 0.3);
        }
        .preview-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.18);
        }
        .notify-wrap {
          margin-top: 2.5rem;
          position: relative;
          z-index: 1;
        }
        .notify-btn {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #0A0E14;
          background: #10B981;
          border: 1px solid #10B981;
          border-radius: 8px;
          padding: 0 1.5rem;
          height: 44px;
          cursor: pointer;
          transition: opacity 0.2s, box-shadow 0.2s;
          white-space: nowrap;
        }
        .notify-btn:hover {
          opacity: 0.9;
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
}

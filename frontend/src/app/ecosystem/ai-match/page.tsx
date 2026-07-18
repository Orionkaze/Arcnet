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
    description: "Maps your stack and strengths to complementary creators.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00EAFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    title: "Smart Jam Squads",
    description: "Auto-builds balanced teams for your next game jam.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00EAFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
  },
  {
    title: "Mentor Recommendations",
    description: "Surfaces experienced devs aligned to your goals.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00EAFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  const showSuccessToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleNotifySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Stub: client-side only, no backend call.
    showSuccessToast("You're on the list!");
    setEmail("");
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
            <p className="font-inter text-sm text-[#C8C7C7]">
              Intelligent matchmaking for game-dev collaboration — coming soon.
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
                stroke="#00EAFF"
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
            <p className="font-inter text-sm text-[#C8C7C7] max-w-[520px] mx-auto mt-3 leading-relaxed">
              AI Match will analyze your skills, portfolio, and goals to
              auto-suggest ideal teammates, jams, and mentors. Think of it as
              matchmaking for game-dev collaboration — the right people for the
              project you actually want to build.
            </p>

            {/* Feature preview grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-left">
              {PREVIEW_FEATURES.map((feature) => (
                <div key={feature.title} className="preview-card">
                  <div className="preview-icon">{feature.icon}</div>
                  <h3 className="font-chakra text-sm text-white font-bold uppercase tracking-wide mt-3">
                    {feature.title}
                  </h3>
                  <p className="font-inter text-xs text-[#C8C7C7] mt-1.5 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Notify me */}
            <div className="notify-wrap relative">
              {successToast && (
                <div className="absolute top-[-44px] left-1/2 -translate-x-1/2 bg-[#00EAFF] text-[#0A0E14] font-bold font-chakra text-xs py-1.5 px-3 rounded shadow-lg z-30 whitespace-nowrap">
                  {successToast}
                </div>
              )}
              <p className="font-inter text-xs text-[#C8C7C7] mb-3">
                Be the first to know when AI Match goes live.
              </p>
              <form
                onSubmit={handleNotifySubmit}
                className="flex flex-col sm:flex-row gap-2.5 justify-center max-w-[440px] mx-auto"
              >
                <input
                  type="email"
                  placeholder="you@studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-grow bg-[#161c24] border border-[#2A313C] text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#00EAFF] transition-colors font-inter"
                  style={{ height: "44px" }}
                />
                <button type="submit" className="notify-btn">
                  Notify Me
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
          color: rgba(0, 234, 255, 0.6);
        }
        .coming-soon-panel {
          background: #10141A;
          border: 1px solid #2A313C;
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
            rgba(0, 234, 255, 0.08) 0%,
            rgba(0, 234, 255, 0) 70%
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
          background: rgba(0, 234, 255, 0.06);
          border: 1px solid rgba(0, 234, 255, 0.2);
          position: relative;
          z-index: 1;
        }
        .spark-icon {
          filter: drop-shadow(0 0 10px rgba(0, 234, 255, 0.55));
          animation: sparkPulse 2.8s ease-in-out infinite;
        }
        @keyframes sparkPulse {
          0%,
          100% {
            filter: drop-shadow(0 0 8px rgba(0, 234, 255, 0.45));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(0, 234, 255, 0.8));
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
          color: #00EAFF;
          background: rgba(0, 234, 255, 0.1);
          border: 1px solid rgba(0, 234, 255, 0.35);
          padding: 0.4rem 1rem;
          border-radius: 999px;
          position: relative;
          z-index: 1;
        }
        .preview-card {
          background: #10141A;
          border: 1px solid #2A313C;
          border-radius: 10px;
          padding: 1.25rem;
          transition: border-color 0.2s;
        }
        .preview-card:hover {
          border-color: rgba(0, 234, 255, 0.3);
        }
        .preview-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(0, 234, 255, 0.08);
          border: 1px solid rgba(0, 234, 255, 0.18);
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
          background: #00EAFF;
          border: 1px solid #00EAFF;
          border-radius: 8px;
          padding: 0 1.5rem;
          height: 44px;
          cursor: pointer;
          transition: opacity 0.2s, box-shadow 0.2s;
          white-space: nowrap;
        }
        .notify-btn:hover {
          opacity: 0.9;
          box-shadow: 0 0 14px rgba(0, 234, 255, 0.4);
        }
      `}</style>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import "../../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuthStore } from "@/store/useAuthStore";

type JamStatus = "Live" | "Upcoming" | "Voting" | "Ended";
type FilterKey = "All" | "Live" | "Upcoming" | "Ended";

interface Jam {
  id: string;
  title: string;
  host: string;
  status: JamStatus;
  theme: string;
  dates: string;
  participants: number;
  prize: string;
  duration: string;
}

const JAMS: Jam[] = [
  {
    id: "arcavon-void-runners",
    title: "Void Runners Sprint",
    host: "Arcavon Studios",
    status: "Live",
    theme: "Theme: Gravity Is A Lie",
    dates: "Jul 16 – Jul 19, 2026",
    participants: 412,
    prize: "₹1,50,000",
    duration: "72 hours",
  },
  {
    id: "kolkata-pixel-forge",
    title: "Pixel Forge Weekend",
    host: "Naga Interactive, Kolkata",
    status: "Live",
    theme: "Theme: One Room, One Rule",
    dates: "Jul 17 – Jul 19, 2026",
    participants: 268,
    prize: "₹75,000",
    duration: "48 hours",
  },
  {
    id: "bengaluru-monsoon-jam",
    title: "Monsoon Micro Jam",
    host: "Dhruva Games, Bengaluru",
    status: "Upcoming",
    theme: "Theme: Rising Tides",
    dates: "Aug 02 – Aug 04, 2026",
    participants: 133,
    prize: "₹50,000",
    duration: "48 hours",
  },
  {
    id: "pune-lore-loop",
    title: "Lore Loop Challenge",
    host: "Chakra Labs, Pune",
    status: "Upcoming",
    theme: "Theme: Echoes of the Ancients",
    dates: "Aug 15 – Aug 22, 2026",
    participants: 89,
    prize: "₹2,00,000",
    duration: "7 days",
  },
  {
    id: "hyderabad-neon-nights",
    title: "Neon Nights Game Jam",
    host: "Meraki Studio, Hyderabad",
    status: "Voting",
    theme: "Theme: After The Blackout",
    dates: "Jul 04 – Jul 07, 2026",
    participants: 341,
    prize: "₹1,00,000",
    duration: "72 hours",
  },
  {
    id: "mumbai-retro-revival",
    title: "Retro Revival Jam",
    host: "Bandra Byte Collective, Mumbai",
    status: "Ended",
    theme: "Theme: 8-Bit Dreams",
    dates: "Jun 20 – Jun 22, 2026",
    participants: 502,
    prize: "₹1,25,000",
    duration: "48 hours",
  },
];

const FEATURED: Jam & { statusLabel: string } = {
  id: "arcavon-monthly-jam",
  title: "Arcavon Monthly Jam",
  host: "Arcavon Studios",
  status: "Live",
  statusLabel: "Live now",
  theme: "Theme: Echoes of the Void",
  dates: "Jul 18 – Jul 21, 2026",
  participants: 1247,
  prize: "₹5,00,000",
  duration: "72 hours",
};

function statusStyles(status: JamStatus): { bg: string; color: string; label: string } {
  switch (status) {
    case "Live":
      return { bg: "rgba(34,197,94,0.15)", color: "#22C55E", label: "Live" };
    case "Upcoming":
      return { bg: "rgba(0,234,255,0.12)", color: "#00EAFF", label: "Upcoming" };
    case "Voting":
      return { bg: "rgba(245,158,11,0.15)", color: "#F59E0B", label: "Voting" };
    case "Ended":
    default:
      return { bg: "rgba(200,199,199,0.12)", color: "#C8C7C7", label: "Ended" };
  }
}

function actionLabel(status: JamStatus): string {
  switch (status) {
    case "Live":
      return "Join Jam";
    case "Upcoming":
      return "Notify Me";
    case "Voting":
      return "Vote Now";
    case "Ended":
    default:
      return "View Results";
  }
}

export default function GameJamsPage() {
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("All");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const filteredJams = useMemo(() => {
    if (filter === "All") return JAMS;
    if (filter === "Live") return JAMS.filter((j) => j.status === "Live");
    if (filter === "Upcoming") return JAMS.filter((j) => j.status === "Upcoming");
    return JAMS.filter((j) => j.status === "Ended" || j.status === "Voting");
  }, [filter]);

  const filters: FilterKey[] = ["All", "Live", "Upcoming", "Ended"];

  return (
    <div className="home-layout">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
      <div className="home-content relative">
        <LeftSidebar />

        <main className="center-feed">
          {/* Toast */}
          {toast && (
            <div className="fixed top-[80px] left-1/2 -translate-x-1/2 bg-[#00EAFF] text-[#0A0E14] font-bold font-chakra text-xs py-2 px-4 rounded shadow-lg z-50">
              {toast}
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col gap-2 mb-6">
            <span className="section-label">ECOSYSTEM</span>
            <h1 className="font-chakra text-2xl text-white font-bold uppercase tracking-wider">
              Game Jams
            </h1>
            <p className="font-inter text-sm text-[#C8C7C7]">
              Featured and upcoming competitions from studios across India. Build, ship, and win.
            </p>
          </div>

          {/* Featured Hero Card */}
          <div className="featured-jam mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="section-label">FEATURED JAM</span>
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-chakra font-bold uppercase tracking-wide px-2 py-0.5 rounded"
                style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}
              >
                <span className="pulse-dot" />
                {FEATURED.statusLabel}
              </span>
            </div>

            <h2 className="font-chakra text-3xl text-white font-bold uppercase tracking-wider leading-tight">
              {FEATURED.title}
            </h2>
            <p className="font-chakra text-sm text-[#00EAFF] uppercase tracking-wide mt-1 font-bold">
              {FEATURED.theme}
            </p>
            <p className="font-inter text-xs text-[#C8C7C7] mt-1">
              Hosted by {FEATURED.host}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <div className="stat-label">Prize Pool</div>
                <div className="stat-value">{FEATURED.prize}</div>
              </div>
              <div>
                <div className="stat-label">Participants</div>
                <div className="stat-value">{FEATURED.participants.toLocaleString("en-IN")}</div>
              </div>
              <div>
                <div className="stat-label">Duration</div>
                <div className="stat-value">{FEATURED.duration}</div>
              </div>
              <div>
                <div className="stat-label">Runs</div>
                <div className="stat-value">{FEATURED.dates}</div>
              </div>
            </div>

            <button
              onClick={() => showToast("You're on the list for the Arcavon Monthly Jam!")}
              className="join-btn mt-6"
            >
              Join Jam
            </button>
          </div>

          {/* Section title + filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="font-chakra text-lg text-white font-bold uppercase tracking-wider">
              Upcoming &amp; Active Jams
            </h3>
            <div className="flex gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="filter-pill"
                  style={{
                    borderColor: filter === f ? "#00EAFF" : "#2A313C",
                    color: filter === f ? "#00EAFF" : "#C8C7C7",
                    background: filter === f ? "rgba(0,234,255,0.08)" : "transparent",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Jams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJams.map((jam) => {
              const s = statusStyles(jam.status);
              return (
                <div key={jam.id} className="jam-card">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h4 className="font-inter text-base font-bold text-white leading-tight truncate">
                        {jam.title}
                      </h4>
                      <span className="font-inter text-xs text-[#C8C7C7]">
                        {jam.host}
                      </span>
                    </div>
                    <span
                      className="flex-shrink-0 text-[10px] font-chakra font-bold uppercase tracking-wide px-2 py-1 rounded"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>

                  <p className="font-chakra text-xs text-[#00EAFF] uppercase tracking-wide mt-3 font-bold truncate">
                    {jam.theme}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div>
                      <div className="stat-label">Prize</div>
                      <div className="stat-value-sm">{jam.prize}</div>
                    </div>
                    <div>
                      <div className="stat-label">Players</div>
                      <div className="stat-value-sm">{jam.participants.toLocaleString("en-IN")}</div>
                    </div>
                    <div>
                      <div className="stat-label">Length</div>
                      <div className="stat-value-sm">{jam.duration}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="font-inter text-xs text-[#C8C7C7]">{jam.dates}</span>
                    <button
                      onClick={() => showToast(`${actionLabel(jam.status)} — ${jam.title}`)}
                      className="jam-action-btn"
                      style={{
                        borderColor: jam.status === "Ended" ? "#2A313C" : "#00EAFF",
                        color: jam.status === "Ended" ? "#C8C7C7" : "#00EAFF",
                      }}
                    >
                      {actionLabel(jam.status)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredJams.length === 0 && (
            <div className="text-center py-16">
              <div className="text-[#C8C7C7] font-inter text-sm">
                No jams found for this filter.
              </div>
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
          color: rgba(0, 234, 255, 0.6);
        }
        .featured-jam {
          background: linear-gradient(135deg, #10141a 0%, #0d1620 100%);
          border: 1px solid rgba(0, 234, 255, 0.3);
          border-radius: 14px;
          padding: 1.75rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 40px rgba(0, 234, 255, 0.06);
          /* .center-feed is a fixed-height flex column; without this the card
             is shrunk by the flex layout and overflow:hidden clips its body. */
          flex-shrink: 0;
        }
        .featured-jam::before {
          content: "";
          position: absolute;
          top: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(0, 234, 255, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .jam-card {
          background: #10141a;
          border: 1px solid #2a313c;
          border-radius: 10px;
          padding: 1.25rem;
          transition: border-color 0.2s;
        }
        .jam-card:hover {
          border-color: rgba(0, 234, 255, 0.3);
        }
        .stat-label {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(200, 199, 199, 0.6);
        }
        .stat-value {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          margin-top: 2px;
        }
        .stat-value-sm {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          margin-top: 2px;
        }
        .join-btn {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          background: #00eaff;
          color: #0a0e14;
          border: none;
          border-radius: 8px;
          padding: 0.7rem 1.6rem;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.1s;
        }
        .join-btn:hover {
          box-shadow: 0 0 20px rgba(0, 234, 255, 0.4);
        }
        .join-btn:active {
          transform: translateY(1px);
        }
        .filter-pill {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          border: 1px solid #2a313c;
          border-radius: 999px;
          padding: 0.35rem 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .jam-action-btn {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: transparent;
          border: 1px solid #00eaff;
          border-radius: 6px;
          padding: 0.4rem 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .jam-action-btn:hover {
          background: rgba(0, 234, 255, 0.08);
        }
        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          display: inline-block;
          animation: pulse 1.4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.35;
          }
        }
      `}</style>
    </div>
  );
}

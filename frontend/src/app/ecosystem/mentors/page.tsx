"use client";

import React, { useState, useEffect, useMemo } from "react";
import "../../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuthStore } from "@/store/useAuthStore";

interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  studio: string;
  specialty: string;
  years: number;
  bio: string;
  expertise: string[];
  rating: number;
  sessions: number;
  price: number;
  verified: boolean;
}

const SPECIALTIES = ["All", "Consulting", "Finance", "Product", "Data", "Aptitude"];

const MENTORS: Mentor[] = [
  {
    id: "m1",
    firstName: "Aarav",
    lastName: "Menon",
    role: "Engagement Manager",
    studio: "McKinsey & Company",
    specialty: "Consulting",
    years: 11,
    bio: "Ex-BCG, now EM. I help you structure ambiguous cases and land a crisp, MECE recommendation.",
    expertise: ["Case Structuring", "Guesstimates", "Frameworks"],
    rating: 4.9,
    sessions: 132,
    price: 1800,
    verified: true,
  },
  {
    id: "m2",
    firstName: "Priya",
    lastName: "Sharma",
    role: "Investment Banking Associate",
    studio: "Goldman Sachs",
    specialty: "Finance",
    years: 9,
    bio: "IB associate on the M&A desk. Valuation, LBOs, and building models that survive scrutiny.",
    expertise: ["DCF", "LBO", "Financial Modeling"],
    rating: 4.8,
    sessions: 88,
    price: 1500,
    verified: true,
  },
  {
    id: "m3",
    firstName: "Rohan",
    lastName: "Iyer",
    role: "Senior Product Manager",
    studio: "Flipkart",
    specialty: "Product",
    years: 8,
    bio: "Shipped 0-to-1 features to millions. Sharpen your product sense and metric-driven thinking.",
    expertise: ["Product Sense", "Metrics", "Prioritization"],
    rating: 4.9,
    sessions: 64,
    price: 1600,
    verified: true,
  },
  {
    id: "m4",
    firstName: "Ananya",
    lastName: "Nair",
    role: "Data Scientist",
    studio: "Swiggy",
    specialty: "Data",
    years: 7,
    bio: "SQL, statistics, and A/B testing. I review your case approach and clean up your analysis.",
    expertise: ["SQL", "A/B Testing", "Statistics"],
    rating: 5.0,
    sessions: 45,
    price: 2000,
    verified: true,
  },
  {
    id: "m5",
    firstName: "Vikram",
    lastName: "Reddy",
    role: "Placement Mentor",
    studio: "Ex-CAT 99.8%iler",
    specialty: "Aptitude",
    years: 10,
    bio: "Quant and DI coach. From fundamentals to speed, I get you interview- and test-ready.",
    expertise: ["Quant", "Data Interpretation", "Logical Reasoning"],
    rating: 4.7,
    sessions: 97,
    price: 1500,
    verified: true,
  },
  {
    id: "m6",
    firstName: "Sneha",
    lastName: "Kulkarni",
    role: "Strategy Consultant",
    studio: "Bain & Company",
    specialty: "Consulting",
    years: 6,
    bio: "Profitability and market-entry cases. I stress-test your logic before the interviewer does.",
    expertise: ["Profitability", "Market Entry", "Mock Interviews"],
    rating: 4.8,
    sessions: 51,
    price: 1400,
    verified: false,
  },
  {
    id: "m7",
    firstName: "Kabir",
    lastName: "Deshmukh",
    role: "Equity Research Analyst",
    studio: "Morgan Stanley",
    specialty: "Finance",
    years: 8,
    bio: "Markets, comps, and three-statement models. I help you talk stocks like a pro in interviews.",
    expertise: ["Equity Research", "Comparables", "Markets"],
    rating: 4.9,
    sessions: 73,
    price: 1700,
    verified: true,
  },
  {
    id: "m8",
    firstName: "Meera",
    lastName: "Pillai",
    role: "Analytics Lead",
    studio: "Zomato",
    specialty: "Data",
    years: 12,
    bio: "Dashboards, experimentation, and metrics. If your analysis is slow or fuzzy, talk to me.",
    expertise: ["Dashboards", "Experimentation", "Product Analytics"],
    rating: 4.9,
    sessions: 110,
    price: 2200,
    verified: true,
  },
];

export default function MentorsPage() {
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [activeSpecialty, setActiveSpecialty] = useState("All");
  // No booking backend yet — record the request locally so the CTA is honest and live.
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const filteredMentors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MENTORS.filter((m) => {
      const matchesSpecialty =
        activeSpecialty === "All" || m.specialty === activeSpecialty;
      if (!matchesSpecialty) return false;
      if (!q) return true;
      const haystack = [
        m.firstName,
        m.lastName,
        m.role,
        m.studio,
        m.specialty,
        ...m.expertise,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, activeSpecialty]);

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
              Find Mentors
            </h1>
            <p className="font-inter text-sm text-[var(--c-text-muted)]">
              Browse verified professionals across consulting, finance, product,
              data, and aptitude &mdash; then book a session.
              <span className="block mt-1 text-xs text-[#8A9099]">Sample profiles — live mentor booking rolls out soon. Request a session to be notified.</span>
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

          {/* Mentors Grid */}
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
                      {mentor.role} @ {mentor.studio}
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
                  <button
                    className="book-btn"
                    onClick={() => setRequested((r) => ({ ...r, [mentor.id]: !r[mentor.id] }))}
                  >
                    {requested[mentor.id] ? "Session Requested ✓" : "Book a Session"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredMentors.length === 0 && (
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

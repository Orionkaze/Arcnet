"use client";

import React, { useState, useEffect, useMemo } from "react";
import "../../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuthStore } from "@/store/useAuthStore";

type EmploymentType = "Full-Time" | "Internship" | "Contract" | "Remote";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: EmploymentType;
  ctc: string;
  skills: string[];
  postedAt: string;
  description: string;
}

const FILTERS: Array<"All" | EmploymentType> = [
  "All",
  "Full-Time",
  "Internship",
  "Contract",
  "Remote",
];

const JOBS: Job[] = [
  {
    id: "1",
    title: "Senior Gameplay Programmer",
    company: "Nazara Nexus Studios",
    location: "Mumbai, MH",
    type: "Full-Time",
    ctc: "₹18-24 LPA",
    skills: ["Unreal", "C++", "Multiplayer", "Gameplay AI"],
    postedAt: "2d ago",
    description:
      "Own core gameplay systems for our flagship multiplayer title. You'll architect combat, movement, and networked state in Unreal Engine 5, collaborating with designers to ship feel-good mechanics at 60fps across mobile and PC.",
  },
  {
    id: "2",
    title: "Unity Game Developer",
    company: "SuperGaming Labs",
    location: "Pune, MH",
    type: "Full-Time",
    ctc: "₹12-18 LPA",
    skills: ["Unity", "C#", "Shader Graph", "Addressables"],
    postedAt: "3d ago",
    description:
      "Build and optimize live-ops features for a hyper-casual portfolio reaching millions of players. Expect deep work on performance profiling, memory budgets, and rapid A/B prototyping inside Unity.",
  },
  {
    id: "3",
    title: "3D Character Artist (Intern)",
    company: "Lakshya Digital",
    location: "Gurugram, HR",
    type: "Internship",
    ctc: "₹25,000/month",
    skills: ["Maya", "ZBrush", "Substance Painter", "Blender"],
    postedAt: "1d ago",
    description:
      "A 6-month studio internship sculpting stylized and realistic characters for global AAA co-development projects. You'll learn production topology, PBR texturing, and how a real art pipeline moves from concept to engine.",
  },
  {
    id: "4",
    title: "Technical Animator",
    company: "Ubisoft Pune",
    location: "Pune, MH",
    type: "Contract",
    ctc: "₹15-20 LPA",
    skills: ["Maya", "Rigging", "Motion Builder", "Python"],
    postedAt: "5d ago",
    description:
      "12-month contract bridging animation and engineering. Build rigs, tune skinning, and script tools that keep our characters expressive while hitting strict runtime budgets on console.",
  },
  {
    id: "5",
    title: "Game Designer",
    company: "Mech Mocha Studios",
    location: "Remote",
    type: "Remote",
    ctc: "₹10-15 LPA",
    skills: ["Systems Design", "Economy Design", "Figma", "LiveOps"],
    postedAt: "4d ago",
    description:
      "Design progression, economy, and retention loops for a card-battler with a growing Tier-2 India audience. You'll write clear design docs, balance spreadsheets, and partner with data to iterate on what keeps players coming back.",
  },
  {
    id: "6",
    title: "Environment Art Intern",
    company: "Rockstar India",
    location: "Bengaluru, KA",
    type: "Internship",
    ctc: "₹15,000/month",
    skills: ["Blender", "Unreal", "Substance Designer", "Trim Sheets"],
    postedAt: "6d ago",
    description:
      "Assist senior environment artists in building modular kits, foliage, and set-dressing for open-world spaces. Ideal for a portfolio-ready junior who wants mentorship inside a AAA environment art team.",
  },
  {
    id: "7",
    title: "Backend Engineer, Game Services",
    company: "WinZO Games",
    location: "New Delhi, DL",
    type: "Full-Time",
    ctc: "₹20-28 LPA",
    skills: ["Node.js", "Go", "Redis", "AWS"],
    postedAt: "1w ago",
    description:
      "Scale real-time matchmaking, leaderboards, and wallets for a social gaming platform serving 100M+ users. You'll own low-latency services, fault tolerance, and the infra that keeps competitive matches fair and fast.",
  },
  {
    id: "8",
    title: "Technical Sound Designer (Contract)",
    company: "Dhruva Interactive",
    location: "Remote",
    type: "Remote",
    ctc: "₹8-12 LPA",
    skills: ["Wwise", "FMOD", "Unreal", "Sound Design"],
    postedAt: "1w ago",
    description:
      "Remote contract implementing adaptive audio for an action-adventure title. Build interactive music systems and reactive SFX in Wwise, and profile audio memory so the mix sings without blowing the budget.",
  },
];

const typeAccent: Record<EmploymentType, string> = {
  "Full-Time": "#00EAFF",
  Internship: "#FFB84D",
  Contract: "#B07CFF",
  Remote: "#4ADE80",
};

export default function JobsPage() {
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | EmploymentType>("All");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return JOBS.filter((job) => {
      const matchesFilter = activeFilter === "All" || job.type === activeFilter;
      if (!matchesFilter) return false;
      if (!q) return true;
      const haystack = [
        job.title,
        job.company,
        job.location,
        ...job.skills,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, activeFilter]);

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
              India-First Job Board
            </h1>
            <p className="font-inter text-sm text-[#C8C7C7]">
              Roles from internships to full-time, with transparent CTC. Find your next studio.
            </p>
          </div>

          {/* Search bar */}
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Search by title, studio, or skill (e.g. Unity, Rigging, Mumbai)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#10141A] border border-[#2A313C] text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#00EAFF] transition-colors font-inter"
              style={{ height: "44px" }}
            />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`filter-pill ${isActive ? "active" : ""}`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {/* Job list */}
          <div className="grid grid-cols-1 gap-4">
            {filteredJobs.map((job) => {
              const accent = typeAccent[job.type];
              const isOpen = !!expanded[job.id];
              return (
                <div key={job.id} className="job-card">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="font-chakra text-base font-bold text-white leading-tight uppercase tracking-wide">
                        {job.title}
                      </h3>
                      <p className="font-inter text-sm text-[#C8C7C7] mt-0.5">
                        {job.company}{" "}
                        <span className="text-[#6B7280]">&middot;</span>{" "}
                        {job.location}
                      </p>
                    </div>
                    <span
                      className="type-pill flex-shrink-0"
                      style={{
                        borderColor: accent,
                        color: accent,
                        background: `${accent}1A`,
                      }}
                    >
                      {job.type}
                    </span>
                  </div>

                  {/* CTC + posted */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-chakra text-sm font-bold text-[#00EAFF]">
                      {job.ctc}
                    </span>
                    <span className="font-inter text-xs text-[#6B7280]">
                      {job.postedAt}
                    </span>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-inter bg-[#2A313C] text-white px-2 py-0.5 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Expandable description */}
                  {isOpen && (
                    <p className="font-inter text-sm text-[#C8C7C7] leading-relaxed mt-4 pt-4 border-t border-[#2A313C]">
                      {job.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => toggleExpand(job.id)}
                      className="job-btn-secondary"
                    >
                      {isOpen ? "Hide Description" : "View Description"}
                    </button>
                    <button className="job-btn-primary">Apply Now</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredJobs.length === 0 && (
            <div className="text-center py-16">
              <div className="text-[#C8C7C7] font-inter text-sm">
                No roles found matching &quot;{search}&quot;.
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
        .job-card {
          background: #10141a;
          border: 1px solid #2a313c;
          border-radius: 10px;
          padding: 1rem;
          transition: border-color 0.2s;
        }
        .job-card:hover {
          border-color: rgba(0, 234, 255, 0.3);
        }
        .filter-pill {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #c8c7c7;
          background: #10141a;
          border: 1px solid #2a313c;
          border-radius: 999px;
          padding: 0.35rem 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-pill:hover {
          border-color: rgba(0, 234, 255, 0.3);
          color: #fff;
        }
        .filter-pill.active {
          color: #00eaff;
          border-color: #00eaff;
          background: rgba(0, 234, 255, 0.1);
        }
        .type-pill {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border: 1px solid;
          border-radius: 999px;
          padding: 0.2rem 0.6rem;
        }
        .job-btn-secondary {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #c8c7c7;
          background: transparent;
          border: 1px solid #2a313c;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .job-btn-secondary:hover {
          border-color: rgba(0, 234, 255, 0.3);
          color: #fff;
        }
        .job-btn-primary {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #0b0e13;
          background: #00eaff;
          border: 1px solid #00eaff;
          border-radius: 8px;
          padding: 0.5rem 1.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .job-btn-primary:hover {
          background: rgba(0, 234, 255, 0.85);
        }
      `}</style>
    </div>
  );
}

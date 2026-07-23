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
    title: "Business Analyst",
    company: "McKinsey & Company",
    location: "Gurugram, HR",
    type: "Full-Time",
    ctc: "₹18-24 LPA",
    skills: ["Case Solving", "Excel", "PowerPoint", "Problem Structuring"],
    postedAt: "2d ago",
    description:
      "Join our consulting team to solve ambiguous business problems for top clients. You'll structure issues, build models, run analyses, and present crisp recommendations to senior stakeholders across industries.",
  },
  {
    id: "2",
    title: "Investment Banking Analyst",
    company: "Goldman Sachs",
    location: "Mumbai, MH",
    type: "Full-Time",
    ctc: "₹16-22 LPA",
    skills: ["Valuation", "Financial Modeling", "DCF", "Excel"],
    postedAt: "3d ago",
    description:
      "Support M&A and capital-markets deals on the IBD floor. Expect deep work on three-statement models, comparable-company analysis, pitch books, and due diligence for live transactions.",
  },
  {
    id: "3",
    title: "Data Analyst Intern",
    company: "Swiggy",
    location: "Bengaluru, KA",
    type: "Internship",
    ctc: "₹40,000/month",
    skills: ["SQL", "Python", "Tableau", "Statistics"],
    postedAt: "1d ago",
    description:
      "A 6-month internship on the analytics team. You'll write SQL, build dashboards, run A/B tests, and turn messy operational data into insights that drive product and growth decisions.",
  },
  {
    id: "4",
    title: "Consulting Associate",
    company: "Bain & Company",
    location: "New Delhi, DL",
    type: "Contract",
    ctc: "₹15-20 LPA",
    skills: ["Market Sizing", "Frameworks", "Client Comms", "Research"],
    postedAt: "5d ago",
    description:
      "12-month engagement supporting case teams on profitability, market-entry, and growth strategy work. Own workstreams, synthesize findings, and help shape the final client recommendation.",
  },
  {
    id: "5",
    title: "Associate Product Manager",
    company: "Flipkart",
    location: "Remote",
    type: "Remote",
    ctc: "₹18-26 LPA",
    skills: ["Product Sense", "Metrics", "Roadmapping", "SQL"],
    postedAt: "4d ago",
    description:
      "Own a slice of the product roadmap for a surface used by millions. You'll write PRDs, define metrics, partner with engineering and design, and iterate on what moves the numbers that matter.",
  },
  {
    id: "6",
    title: "Equity Research Intern",
    company: "Morgan Stanley",
    location: "Mumbai, MH",
    type: "Internship",
    ctc: "₹35,000/month",
    skills: ["Excel", "Valuation", "Industry Research", "Modeling"],
    postedAt: "6d ago",
    description:
      "Assist senior analysts in covering listed companies and sectors. Build models, track earnings, and draft the research notes that inform institutional investment decisions.",
  },
  {
    id: "7",
    title: "Data Scientist",
    company: "Zomato",
    location: "Bengaluru, KA",
    type: "Full-Time",
    ctc: "₹20-28 LPA",
    skills: ["Python", "SQL", "Machine Learning", "Experimentation"],
    postedAt: "1w ago",
    description:
      "Build models and experiments that power personalization, pricing, and growth for millions of users. You'll own the full loop from problem framing to production impact alongside product and engineering.",
  },
  {
    id: "8",
    title: "Strategy Consultant (Contract)",
    company: "BCG",
    location: "Remote",
    type: "Remote",
    ctc: "₹18-25 LPA",
    skills: ["Case Structuring", "Analytics", "Storylining", "Excel"],
    postedAt: "1w ago",
    description:
      "Remote engagement helping clients with growth and operations strategy. Structure problems, run the analysis, and turn findings into a clear, executive-ready storyline.",
  },
];

const typeAccent: Record<EmploymentType, string> = {
  "Full-Time": "#10B981",
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
  // No employer backend yet — record interest locally so the CTA is honest and live.
  const [requested, setRequested] = useState<Record<string, boolean>>({});

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
            <p className="font-inter text-sm text-[var(--c-text-muted)]">
              Roles from internships to full-time, with transparent CTC. Find your next opportunity.
              <span className="block mt-1 text-xs text-[#8A9099]">Sample listings — live employer postings roll out soon. Register interest to be notified.</span>
            </p>
          </div>

          {/* Search bar */}
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Search by title, company, or skill (e.g. SQL, Valuation, Mumbai)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--c-surface)] border border-[var(--c-border)] text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#10B981] transition-colors font-inter"
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
                      <p className="font-inter text-sm text-[var(--c-text-muted)] mt-0.5">
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
                    <span className="font-chakra text-sm font-bold text-[#10B981]">
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
                        className="text-[10px] font-inter bg-[var(--c-border)] text-white px-2 py-0.5 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Expandable description */}
                  {isOpen && (
                    <p className="font-inter text-sm text-[var(--c-text-muted)] leading-relaxed mt-4 pt-4 border-t border-[var(--c-border)]">
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
                    <button
                      className="job-btn-primary"
                      onClick={() => setRequested((r) => ({ ...r, [job.id]: !r[job.id] }))}
                    >
                      {requested[job.id] ? "Interest Registered ✓" : "Apply Now"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredJobs.length === 0 && (
            <div className="text-center py-16">
              <div className="text-[var(--c-text-muted)] font-inter text-sm">
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
          color: rgba(16, 185, 129, 0.6);
        }
        .job-card {
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: 10px;
          padding: 1rem;
          transition: border-color 0.2s;
        }
        .job-card:hover {
          border-color: rgba(16, 185, 129, 0.3);
        }
        .filter-pill {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--c-text-muted);
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: 999px;
          padding: 0.35rem 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-pill:hover {
          border-color: rgba(16, 185, 129, 0.3);
          color: #fff;
        }
        .filter-pill.active {
          color: #10B981;
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.1);
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
          color: var(--c-text-muted);
          background: transparent;
          border: 1px solid var(--c-border);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .job-btn-secondary:hover {
          border-color: rgba(16, 185, 129, 0.3);
          color: #fff;
        }
        .job-btn-primary {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--c-bg);
          background: #10B981;
          border: 1px solid #10B981;
          border-radius: 8px;
          padding: 0.5rem 1.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .job-btn-primary:hover {
          background: rgba(16, 185, 129, 0.85);
        }
      `}</style>
    </div>
  );
}

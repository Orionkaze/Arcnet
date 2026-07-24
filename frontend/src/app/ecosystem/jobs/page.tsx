"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import "../../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuthStore } from "@/store/useAuthStore";
import PostRoleModal from "@/components/ecosystem/PostRoleModal";

type EmploymentType = "Full-Time" | "Internship" | "Contract" | "Remote";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: EmploymentType;
  ctc: string;
  skills: string[];
  postedAt: string; // ISO date
  description: string;
  applied: boolean;
  mine: boolean;
}

const EMPLOYMENT_TYPES: EmploymentType[] = [
  "Full-Time",
  "Internship",
  "Contract",
  "Remote",
];

interface PostRoleForm {
  title: string;
  company: string;
  location: string;
  type: EmploymentType;
  ctc: string;
  skills: string;
  description: string;
}

const EMPTY_FORM: PostRoleForm = {
  title: "",
  company: "",
  location: "",
  type: "Full-Time",
  ctc: "",
  skills: "",
  description: "",
};

const FILTERS: Array<"All" | EmploymentType> = [
  "All",
  "Full-Time",
  "Internship",
  "Contract",
  "Remote",
];

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

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyMsg, setApplyMsg] = useState<Record<string, string>>({});
  const [isPostOpen, setIsPostOpen] = useState(false);

  const [showPostModal, setShowPostModal] = useState(false);
  const [form, setForm] = useState<PostRoleForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs");
      if (!res.ok) throw new Error("Failed to load roles");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
      setError("Could not load roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    // Defer so the initial setState in fetchJobs doesn't run synchronously
    // inside the effect body (project lint rule).
    const t = setTimeout(() => fetchJobs(), 0);
    return () => clearTimeout(t);
  }, [checkAuth, fetchJobs]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApply = async (id: string) => {
    setApplyMsg((m) => {
      const { [id]: _omit, ...rest } = m;
      return rest;
    });
    // Optimistic toggle; revert on failure.
    let prevApplied = false;
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          prevApplied = j.applied;
          return { ...j, applied: !j.applied };
        }
        return j;
      })
    );
    try {
      const res = await fetch(`/api/jobs/${id}/apply`, { method: "POST" });
      if (res.status === 401) {
        setJobs((prev) =>
          prev.map((j) => (j.id === id ? { ...j, applied: prevApplied } : j))
        );
        setApplyMsg((m) => ({ ...m, [id]: "Log in to apply." }));
        return;
      }
      if (!res.ok) throw new Error("Apply failed");
      const data = await res.json();
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, applied: !!data.applied } : j))
      );
    } catch (err) {
      console.error(err);
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, applied: prevApplied } : j))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this listing? This can't be undone.")) return;
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setApplyMsg((m) => ({ ...m, [id]: data.error || "Could not delete." }));
        return;
      }
      fetchJobs();
    } catch {
      setApplyMsg((m) => ({ ...m, [id]: "Could not delete." }));
    }
  };

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
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
  }, [search, activeFilter, jobs]);

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
                India-First Job Board
              </h1>
              <button
                onClick={() => setIsPostOpen(true)}
                className="job-btn-primary flex-shrink-0"
              >
                + Post a Role
              </button>
            </div>
            <p className="font-inter text-sm text-[var(--c-text-muted)]">
              Roles from internships to full-time, with transparent CTC. Find your next opportunity.
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

          {/* Loading / error / empty states */}
          {loading && (
            <div className="text-[var(--c-text-muted)] font-inter text-sm py-6">
              Loading roles…
            </div>
          )}
          {!loading && error && (
            <div className="text-[var(--c-text-muted)] font-inter text-sm py-6">
              {error}
            </div>
          )}
          {!loading && !error && jobs.length === 0 && (
            <div className="text-center py-16">
              <div className="text-[var(--c-text-muted)] font-inter text-sm">
                No roles yet.
              </div>
            </div>
          )}

          {/* Job list */}
          {!loading && !error && jobs.length > 0 && (
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
                      {timeAgo(job.postedAt)}
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
                      onClick={() => handleApply(job.id)}
                    >
                      {job.applied ? "Applied ✓" : "Apply Now"}
                    </button>
                    {job.mine && (
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="ml-auto font-inter text-xs text-[#FF4D4D] hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  {applyMsg[job.id] && (
                    <p className="font-inter text-xs text-[#6B7280] mt-2">
                      {applyMsg[job.id]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          )}

          {/* Empty state (search/filter yielded nothing) */}
          {!loading && !error && jobs.length > 0 && filteredJobs.length === 0 && (
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

      <PostRoleModal
        open={isPostOpen}
        onClose={() => setIsPostOpen(false)}
        onCreated={fetchJobs}
      />

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

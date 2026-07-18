"use client";

import { useMemo, useState } from "react";
import s from "../caliber.module.css";

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

const FILTERS: Array<"All" | EmploymentType> = ["All", "Full-Time", "Internship", "Contract", "Remote"];

const JOBS: Job[] = [
  {
    id: "1",
    title: "Business Analyst — Intern",
    company: "Kearney",
    location: "Mumbai, MH",
    type: "Internship",
    ctc: "₹40,000/month",
    skills: ["Excel", "PowerPoint", "Case", "Problem-Solving"],
    postedAt: "2d ago",
    description:
      "An 8-week internship supporting live client engagements. You'll build slide decks, run Excel analyses, and sit in on problem-solving sessions with the case team — a direct look at how strategy consulting actually works day to day.",
  },
  {
    id: "2",
    title: "Investment Banking Analyst",
    company: "a bulge-bracket bank",
    location: "Mumbai, MH",
    type: "Full-Time",
    ctc: "₹18-25 LPA",
    skills: ["Valuation", "Financial Modeling", "DCF", "PowerPoint"],
    postedAt: "3d ago",
    description:
      "Join the M&A coverage team building valuation models, pitch books, and deal materials. Expect deep work in Excel and PowerPoint, tight deadlines, and exposure to live transactions from day one.",
  },
  {
    id: "3",
    title: "Associate Product Manager",
    company: "a top product company",
    location: "Bengaluru, KA",
    type: "Full-Time",
    ctc: "₹20-28 LPA",
    skills: ["Product", "Analytics", "SQL", "Prioritization"],
    postedAt: "1d ago",
    description:
      "An APM role for new grads who love building. You'll own a slice of the product roadmap, dig into usage analytics, write crisp specs, and partner with design and engineering to ship features users notice.",
  },
  {
    id: "4",
    title: "Data Analyst",
    company: "a consumer-internet firm",
    location: "Gurugram, HR",
    type: "Full-Time",
    ctc: "₹8-14 LPA",
    skills: ["SQL", "Python", "Dashboards", "Statistics"],
    postedAt: "5d ago",
    description:
      "Turn raw product and business data into decisions. You'll write SQL, build dashboards, and run analyses that tell stakeholders what's working and what to fix. Strong fundamentals in stats and Python expected.",
  },
  {
    id: "5",
    title: "Strategy Consulting — Summer Intern",
    company: "Bain & Company",
    location: "New Delhi, DL",
    type: "Internship",
    ctc: "₹1,00,000/month",
    skills: ["Problem-Solving", "Structuring", "Excel", "Case"],
    postedAt: "4d ago",
    description:
      "A flagship summer internship on a real case team. You'll frame problems, run analyses, and present findings to managers — the standard conversion path into a full-time consulting offer for strong performers.",
  },
  {
    id: "6",
    title: "Equity Research Associate",
    company: "an asset-management firm",
    location: "Mumbai, MH",
    type: "Full-Time",
    ctc: "₹12-18 LPA",
    skills: ["Finance", "Financial Modeling", "Writing", "Valuation"],
    postedAt: "6d ago",
    description:
      "Cover a sector alongside a senior analyst: build earnings models, track company filings, and write research notes with a clear investment view. Ideal for someone who pairs strong finance skills with sharp writing.",
  },
  {
    id: "7",
    title: "Data Science — Intern",
    company: "a healthtech startup",
    location: "Remote",
    type: "Remote",
    ctc: "₹35,000/month",
    skills: ["Python", "SQL", "Statistics", "Machine Learning"],
    postedAt: "1w ago",
    description:
      "A 6-month remote internship on the data team. You'll clean messy datasets, prototype models, and ship analyses into production dashboards. Great for a student who wants real ML experience before graduating.",
  },
  {
    id: "8",
    title: "Management Consulting — Contract Analyst",
    company: "a boutique strategy firm",
    location: "Remote",
    type: "Contract",
    ctc: "₹10-15 LPA",
    skills: ["Structuring", "Market Sizing", "Excel", "PowerPoint"],
    postedAt: "1w ago",
    description:
      "A 12-month contract supporting client engagements remotely. You'll size markets, structure problems, and build the analyses that back up recommendations — a flexible route into strategy work with real client exposure.",
  },
];

const typeAccent: Record<EmploymentType, string> = {
  "Full-Time": "#3B82F6",
  Internship: "#FFB84D",
  Contract: "#B07CFF",
  Remote: "#4ADE80",
};

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | EmploymentType>("All");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return JOBS.filter((job) => {
      const matchesFilter = activeFilter === "All" || job.type === activeFilter;
      if (!matchesFilter) return false;
      if (!q) return true;
      const haystack = [job.title, job.company, job.location, ...job.skills].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [search, activeFilter]);

  return (
    <div className={s.wrap}>
      <h1 className={s.h1}>Opportunities</h1>
      <p className={s.sub}>Roles from internships to full-time, with transparent pay. Find your next team.</p>

      <input
        className={s.input}
        style={{ marginBottom: "1rem" }}
        type="text"
        placeholder="Search by title, company, or skill (e.g. Valuation, SQL, Mumbai)…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", marginBottom: "1.5rem" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={activeFilter === f ? s.choiceSel : s.choice}
            style={{ width: "auto", marginBottom: 0 }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.map((job) => {
        const accent = typeAccent[job.type];
        const isOpen = !!expanded[job.id];
        return (
          <div key={job.id} className={s.card} style={{ cursor: "default" }}>
            <div className={s.rowBetween}>
              <strong>{job.title}</strong>
              <span className={s.pill} style={{ color: accent, background: `${accent}1A` }}>{job.type}</span>
            </div>
            <div className={s.muted} style={{ marginTop: ".25rem" }}>
              {job.company} · {job.location}
            </div>
            <div className={s.rowBetween} style={{ marginTop: ".5rem" }}>
              <strong style={{ color: "#3B82F6", fontSize: ".9rem" }}>{job.ctc}</strong>
              <span className={s.muted}>{job.postedAt}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginTop: ".6rem" }}>
              {job.skills.map((skill) => (
                <span key={skill} className={s.muted} style={{ border: "1px solid #262B33", borderRadius: "6px", padding: ".1rem .45rem" }}>
                  {skill}
                </span>
              ))}
            </div>
            {isOpen && (
              <p style={{ margin: "1rem 0 0", paddingTop: "1rem", borderTop: "1px solid #262B33", fontSize: ".9rem", lineHeight: 1.55 }}>
                {job.description}
              </p>
            )}
            <div style={{ display: "flex", gap: ".5rem", marginTop: ".9rem" }}>
              <button
                onClick={() => setExpanded((prev) => ({ ...prev, [job.id]: !prev[job.id] }))}
                className={s.choice}
                style={{ width: "auto", marginBottom: 0 }}
              >
                {isOpen ? "Hide description" : "View description"}
              </button>
              <button className={s.btn} disabled>Apply</button>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && <div className={s.state}>No roles match &quot;{search}&quot;.</div>}
    </div>
  );
}

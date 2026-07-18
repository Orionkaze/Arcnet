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
        placeholder="Search by title, company, or skill (e.g. Unity, Rigging, Mumbai)…"
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

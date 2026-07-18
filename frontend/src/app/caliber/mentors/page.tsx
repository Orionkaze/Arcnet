"use client";

import { useMemo, useState } from "react";
import s from "../caliber.module.css";

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

const SPECIALTIES = ["All", "Game Design", "Animation", "VFX", "Programming", "Art"];

const MENTORS: Mentor[] = [
  {
    id: "m1",
    firstName: "Aarav",
    lastName: "Menon",
    role: "Senior Game Designer",
    studio: "Nodding Heads Games",
    specialty: "Game Design",
    years: 11,
    bio: "Shipped 3 console titles. I help you turn a loose idea into a tight, playable core loop.",
    expertise: ["Systems Design", "Level Design", "Prototyping"],
    rating: 4.9,
    sessions: 132,
    price: 1800,
    verified: true,
  },
  {
    id: "m2",
    firstName: "Priya",
    lastName: "Sharma",
    role: "Lead Character Animator",
    studio: "Technicolor India",
    specialty: "Animation",
    years: 9,
    bio: "Ex-feature-film animator now in games. Rigging, weight, and believable secondary motion.",
    expertise: ["Rigging", "Maya", "Motion Capture"],
    rating: 4.8,
    sessions: 88,
    price: 1500,
    verified: true,
  },
  {
    id: "m3",
    firstName: "Rohan",
    lastName: "Iyer",
    role: "Senior VFX Artist",
    studio: "Sumo Digital Pune",
    specialty: "VFX",
    years: 8,
    bio: "Real-time particles and shaders in Niagara. Make your abilities read and feel impactful.",
    expertise: ["Niagara", "Shaders", "Houdini"],
    rating: 4.9,
    sessions: 64,
    price: 1600,
    verified: true,
  },
  {
    id: "m4",
    firstName: "Ananya",
    lastName: "Nair",
    role: "Gameplay Programmer",
    studio: "Ubisoft Pune",
    specialty: "Programming",
    years: 7,
    bio: "C++ and Unreal blueprints. I debug your gameplay loops and clean up your architecture.",
    expertise: ["Unreal", "C++", "Multiplayer"],
    rating: 5.0,
    sessions: 45,
    price: 2000,
    verified: true,
  },
  {
    id: "m5",
    firstName: "Vikram",
    lastName: "Reddy",
    role: "Environment Artist",
    studio: "Rockstar India",
    specialty: "Art",
    years: 10,
    bio: "AAA world-building. From blockout to lit, dressed scenes that stay within a memory budget.",
    expertise: ["Substance", "Blender", "Trim Sheets"],
    rating: 4.7,
    sessions: 97,
    price: 1500,
    verified: true,
  },
  {
    id: "m6",
    firstName: "Sneha",
    lastName: "Kulkarni",
    role: "Technical Animator",
    studio: "Lakshya Digital",
    specialty: "Animation",
    years: 6,
    bio: "Bridge between animation and code. Animation pipelines, retargeting, and state machines.",
    expertise: ["Rigging", "Python", "Unity Mecanim"],
    rating: 4.8,
    sessions: 51,
    price: 1400,
    verified: false,
  },
  {
    id: "m7",
    firstName: "Kabir",
    lastName: "Deshmukh",
    role: "Narrative & Systems Designer",
    studio: "Studio Sirah",
    specialty: "Game Design",
    years: 8,
    bio: "Branching narrative and economy balancing. I stress-test your progression before players do.",
    expertise: ["Narrative", "Economy", "Balancing"],
    rating: 4.9,
    sessions: 73,
    price: 1700,
    verified: true,
  },
  {
    id: "m8",
    firstName: "Meera",
    lastName: "Pillai",
    role: "Tools & Engine Programmer",
    studio: "Zynga Bangalore",
    specialty: "Programming",
    years: 12,
    bio: "Editor tooling and performance. If your build is slow or your workflow hurts, talk to me.",
    expertise: ["C#", "Profiling", "Editor Tools"],
    rating: 4.9,
    sessions: 110,
    price: 2200,
    verified: true,
  },
];

export default function MentorsPage() {
  const [search, setSearch] = useState("");
  const [activeSpecialty, setActiveSpecialty] = useState("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MENTORS.filter((m) => {
      const matchesSpecialty = activeSpecialty === "All" || m.specialty === activeSpecialty;
      if (!matchesSpecialty) return false;
      if (!q) return true;
      const haystack = [m.firstName, m.lastName, m.role, m.studio, m.specialty, ...m.expertise]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, activeSpecialty]);

  return (
    <div className={s.wrap}>
      <h1 className={s.h1}>Mentors</h1>
      <p className={s.sub}>Learn from people who have done it — book a focused session to unblock your work.</p>

      <input
        className={s.input}
        style={{ marginBottom: "1rem" }}
        type="text"
        placeholder="Search by name or expertise (e.g. Rigging, Unreal, Systems Design)…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", marginBottom: "1.5rem" }}>
        {SPECIALTIES.map((spec) => (
          <button
            key={spec}
            onClick={() => setActiveSpecialty(spec)}
            className={activeSpecialty === spec ? s.choiceSel : s.choice}
            style={{ width: "auto", marginBottom: 0 }}
          >
            {spec}
          </button>
        ))}
      </div>

      {filtered.map((m) => (
        <div key={m.id} className={s.card} style={{ cursor: "default" }}>
          <div className={s.rowBetween}>
            <strong>{m.firstName} {m.lastName}</strong>
            <span className={s.pill}>{m.specialty}</span>
          </div>
          <div className={s.muted} style={{ marginTop: ".25rem" }}>
            {m.role} @ {m.studio} · {m.years} yrs
          </div>
          <p style={{ margin: ".6rem 0 0", fontSize: ".9rem", lineHeight: 1.5 }}>{m.bio}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginTop: ".6rem" }}>
            {m.expertise.map((tag) => (
              <span key={tag} className={s.muted} style={{ border: "1px solid #262B33", borderRadius: "6px", padding: ".1rem .45rem" }}>
                {tag}
              </span>
            ))}
          </div>
          <div className={s.rowBetween} style={{ marginTop: ".9rem" }}>
            <span className={s.muted}>★ {m.rating.toFixed(1)} ({m.sessions} sessions) · ₹{m.price.toLocaleString("en-IN")} / 45 min</span>
            <button className={s.btn} disabled>Book</button>
          </div>
        </div>
      ))}

      {filtered.length === 0 && <div className={s.state}>No mentors match &quot;{search}&quot;.</div>}
    </div>
  );
}

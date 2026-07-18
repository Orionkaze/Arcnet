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

const SPECIALTIES = ["All", "Consulting", "Finance", "Product", "Data", "Aptitude"];

const MENTORS: Mentor[] = [
  {
    id: "m1",
    firstName: "Ananya",
    lastName: "Rao",
    role: "Engagement Manager",
    studio: "McKinsey & Company",
    specialty: "Consulting",
    years: 7,
    bio: "Cracked case interviews at all three MBB firms. I teach you to structure fast, drive the case, and land the recommendation.",
    expertise: ["Case Cracking", "Structuring", "Guesstimates"],
    rating: 4.9,
    sessions: 132,
    price: 1800,
    verified: true,
  },
  {
    id: "m2",
    firstName: "Rohan",
    lastName: "Mehta",
    role: "VP, Investment Banking",
    studio: "a bulge-bracket bank",
    specialty: "Finance",
    years: 9,
    bio: "Nine years in IB across M&A and leveraged finance. We'll build models that hold up and answers that survive the superday.",
    expertise: ["Valuation", "LBO", "DCF"],
    rating: 4.8,
    sessions: 88,
    price: 1500,
    verified: true,
  },
  {
    id: "m3",
    firstName: "Sara",
    lastName: "Iyer",
    role: "Senior Product Manager",
    studio: "a top product company",
    specialty: "Product",
    years: 6,
    bio: "I ship products used by millions. Sharpen your product sense, learn the metrics that matter, and ace the PM loop.",
    expertise: ["Product Sense", "Metrics", "Prioritization"],
    rating: 4.9,
    sessions: 64,
    price: 1600,
    verified: true,
  },
  {
    id: "m4",
    firstName: "Vikram",
    lastName: "Nair",
    role: "Lead Data Scientist",
    studio: "a consumer-tech unicorn",
    specialty: "Data",
    years: 8,
    bio: "From SQL rounds to business case studies, I coach you through the full data-science and analytics interview funnel.",
    expertise: ["SQL", "Stats", "Case Studies"],
    rating: 5.0,
    sessions: 45,
    price: 2000,
    verified: true,
  },
  {
    id: "m5",
    firstName: "Neha",
    lastName: "Gupta",
    role: "Placement Coach",
    studio: "campus placement cell",
    specialty: "Aptitude",
    years: 5,
    bio: "I've prepped hundreds of students for placement season. Aptitude, DI, and interview nerves — we drill them until they're easy.",
    expertise: ["Aptitude", "DI", "Interview Prep"],
    rating: 4.7,
    sessions: 97,
    price: 1200,
    verified: true,
  },
  {
    id: "m6",
    firstName: "Arjun",
    lastName: "Shah",
    role: "Strategy Consultant",
    studio: "BCG",
    specialty: "Consulting",
    years: 5,
    bio: "Ex-strategy consultant who lives in frameworks. We'll practice market sizing and case structuring until they're second nature.",
    expertise: ["Frameworks", "Market Sizing", "Case Cracking"],
    rating: 4.8,
    sessions: 73,
    price: 1700,
    verified: true,
  },
  {
    id: "m7",
    firstName: "Priya",
    lastName: "Sharma",
    role: "Associate Product Manager",
    studio: "a fintech scale-up",
    specialty: "Product",
    years: 4,
    bio: "Broke into APM straight from campus. I know exactly what fresh grads get asked and how to stand out without years of experience.",
    expertise: ["Product Sense", "Analytics", "Prioritization"],
    rating: 4.8,
    sessions: 51,
    price: 1300,
    verified: false,
  },
  {
    id: "m8",
    firstName: "Karan",
    lastName: "Desai",
    role: "Equity Research Associate",
    studio: "an asset-management firm",
    specialty: "Finance",
    years: 6,
    bio: "I read financial statements for a living. Learn valuation, modeling, and how to defend a stock pitch under pressure.",
    expertise: ["Valuation", "Financial Modeling", "DCF"],
    rating: 4.9,
    sessions: 110,
    price: 1600,
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
        placeholder="Search by name or expertise (e.g. Case Cracking, Valuation, SQL)…"
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

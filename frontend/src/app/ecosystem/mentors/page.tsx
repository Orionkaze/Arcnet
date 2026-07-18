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
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [activeSpecialty, setActiveSpecialty] = useState("All");

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
            <p className="font-inter text-sm text-[#C8C7C7]">
              Browse verified professionals across game design, animation, VFX, art
              and code &mdash; then book a session.
            </p>
          </div>

          {/* Search bar */}
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Search by name or expertise (e.g. Rigging, Unreal, Level Design)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#161c24] border border-[#2A313C] text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#00EAFF] transition-colors font-inter"
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
                    <div className="w-12 h-12 rounded-full bg-[#2A313C] overflow-hidden flex items-center justify-center font-bold text-lg text-white border border-[#2A313C]">
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
                          style={{ background: "rgba(0,234,255,0.12)" }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#00EAFF"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </span>
                      )}
                    </div>

                    <p className="font-chakra text-xs text-[#00EAFF] uppercase tracking-wide mt-1 font-bold truncate">
                      {mentor.role} @ {mentor.studio}
                    </p>
                    <span className="font-inter text-[11px] text-[#C8C7C7]">
                      {mentor.years} yrs experience
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <p className="font-inter text-xs text-[#C8C7C7] mt-3 leading-relaxed">
                  {mentor.bio}
                </p>

                {/* Expertise tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {mentor.expertise.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-inter bg-[#2A313C] text-white px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Rating + price + CTA */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2A313C]">
                  <div className="flex flex-col">
                    <span className="font-inter text-xs text-white">
                      <span className="text-[#00EAFF]">&#9733;</span> {mentor.rating.toFixed(1)}{" "}
                      <span className="text-[#C8C7C7]">({mentor.sessions} sessions)</span>
                    </span>
                    <span className="font-chakra text-xs text-white font-bold mt-0.5">
                      &#8377;{mentor.price.toLocaleString("en-IN")} / 45 min
                    </span>
                  </div>
                  <button className="book-btn">Book a Session</button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredMentors.length === 0 && (
            <div className="text-center py-16">
              <div className="text-[#C8C7C7] font-inter text-sm">
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
          color: rgba(0, 234, 255, 0.6);
        }
        .mentor-card {
          background: #10141a;
          border: 1px solid #2a313c;
          border-radius: 10px;
          padding: 1rem;
          transition: border-color 0.2s;
        }
        .mentor-card:hover {
          border-color: rgba(0, 234, 255, 0.3);
        }
        .specialty-pill {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #c8c7c7;
          background: #10141a;
          border: 1px solid #2a313c;
          border-radius: 9999px;
          padding: 6px 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .specialty-pill:hover {
          border-color: rgba(0, 234, 255, 0.3);
          color: #ffffff;
        }
        .specialty-pill.active {
          color: #00eaff;
          border-color: #00eaff;
          background: rgba(0, 234, 255, 0.08);
        }
        .book-btn {
          font-family: var(--font-chakra-petch), sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #0a0e14;
          background: #00eaff;
          border: none;
          border-radius: 8px;
          padding: 8px 14px;
          cursor: pointer;
          flex-shrink: 0;
          transition: filter 0.2s, box-shadow 0.2s;
        }
        .book-btn:hover {
          filter: brightness(1.1);
          box-shadow: 0 0 12px rgba(0, 234, 255, 0.4);
        }
      `}</style>
    </div>
  );
}

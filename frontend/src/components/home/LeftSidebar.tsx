"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gameDevLogo from "./LeftSideBarLogos/GameDeveloperHub.png";
import gameTesterLogo from "./LeftSideBarLogos/GameTesterHub.png";
// import 2D3DArtistLogo from "./LeftSideBarLogos/2D3DArtistHub.png";
// import AnimatorLogo from "./LeftSideBarLogos/AnimatorHub.png";
import StoryWriterLogo from "./LeftSideBarLogos/StoryWriterHub.png";

export default function LeftSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path.startsWith("/ecosystem/")) {
      const shortPath = path.replace("/ecosystem", "");
      return pathname === path || pathname === shortPath;
    }
    if (path.startsWith("/")) {
      const ecoPath = "/ecosystem" + path;
      return pathname === path || pathname === ecoPath;
    }
    return pathname === path;
  };

  return (
    <aside className="left-sidebar">
      <div className="sidebar-content">
        {/* PUBLIC HUBS */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span className="sidebar-section-label">PUBLIC HUBS</span>
            <span className="sidebar-section-line" />
          </div>

          <Link
            href="/hub/game-developers"
            className={`sidebar-item ${isActive("/hub/game-developers") ? "active" : ""}`}
          >
            {/* Controller icon */}
            {/* <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="3" />
              <path d="M6 12h4M8 10v4" />
              <circle cx="17" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="13" r="1" fill="currentColor" />
            </svg> */}
            <img src={gameDevLogo.src} alt="Game Developer Hub" style={{width: '20px', height: '20px'}} />
            <span>Game Developers</span>
          </Link>

          <Link
            href="/hub/2d-3d-artists"
            className={`sidebar-item ${isActive("/hub/2d-3d-artists") ? "active" : ""}`}
          >
            {/* Palette icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 00-1 19.95c.6.05 1-.4 1-1v-1.67a1 1 0 00-1.06-1C7.56 18 6 16.5 6 14c0-1.5.8-3 2-4s1.5-2.5 1.5-4a4.5 4.5 0 019 0c0 1.5-.5 3 1.5 4s2 2.5 2 4c0 2.5-1.56 4-4.94 4.28a1 1 0 00-1.06 1V21c0 .6.4 1.05 1 1A10 10 0 0012 2z" />
              <circle cx="8" cy="10" r="1.5" fill="currentColor" />
              <circle cx="12" cy="7" r="1.5" fill="currentColor" />
              <circle cx="16" cy="10" r="1.5" fill="currentColor" />
            </svg>
            <span>2D / 3D Artists</span>
          </Link>

          <Link
            href="/hub/animators"
            className={`sidebar-item ${isActive("/hub/animators") ? "active" : ""}`}
          >
            {/* Play icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5,3 19,12 5,21 5,3" />
            </svg>
            <span>Animators</span>
          </Link>

          <Link
            href="/hub/storywriters"
            className={`sidebar-item ${isActive("/hub/storywriters") ? "active" : ""}`}
          >
            {/* Pen icon */}
            {/* <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg> */}
            <img src={StoryWriterLogo.src} alt="Story Writer Hub" style={{width: '20px', height: '20px'}} />
            <span>Storywriters</span>
          </Link>

          <Link
            href="/hub/game-testers"
            className={`sidebar-item ${isActive("/hub/game-testers") ? "active" : ""}`}
          >
            {/* Bug icon */}
            {/* <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="6" width="8" height="14" rx="4" />
              <path d="M6 10H2M22 10h-4M6 18H2M22 18h-4M8 6l-2-4M16 6l2-4" />
              <line x1="12" y1="6" x2="12" y2="2" />
            </svg> */}
            <img src={gameTesterLogo.src} alt="Game Tester Hub" style={{width: '20px', height: '20px'}} />
            <span>Game Testers</span>
          </Link>
        </div>

        {/* ECOSYSTEM */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span className="sidebar-section-label">ECOSYSTEM</span>
            <span className="sidebar-section-line" />
          </div>

          <Link
            href="/ecosystem/game-jams"
            className={`sidebar-item ${isActive("/ecosystem/game-jams") ? "active" : ""}`}
          >
            {/* Trophy icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H3a1 1 0 01-1-1V5a1 1 0 011-1h3" />
              <path d="M18 9h3a1 1 0 001-1V5a1 1 0 00-1-1h-3" />
              <path d="M6 4h12v6a6 6 0 01-12 0V4z" />
              <path d="M12 16v2" />
              <path d="M8 22h8" />
              <path d="M8 22v-4M16 22v-4" />
            </svg>
            <span>Game Jams</span>
          </Link>

          <Link
            href="/ecosystem/find-team"
            className={`sidebar-item ${isActive("/ecosystem/find-team") ? "active" : ""}`}
          >
            {/* People icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span>Find Team</span>
          </Link>

          <Link
            href="/ecosystem/mentors"
            className={`sidebar-item ${isActive("/ecosystem/mentors") ? "active" : ""}`}
          >
            {/* Graduation cap icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12,2 2,7 12,12 22,7" />
              <path d="M2 7v6c0 3 4.5 6 10 6s10-3 10-6V7" />
              <path d="M22 7v8" />
            </svg>
            <span>Mentors</span>
          </Link>

          <Link
            href="/ecosystem/jobs"
            className={`sidebar-item ${isActive("/ecosystem/jobs") ? "active" : ""}`}
          >
            {/* Briefcase icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              <path d="M2 12h20" />
            </svg>
            <span>Jobs</span>
          </Link>

          <Link
            href="/ecosystem/ai-match"
            className={`sidebar-item ${isActive("/ecosystem/ai-match") ? "active" : ""}`}
          >
            {/* Spark / AI icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z" />
            </svg>
            <span>AI Match</span>
          </Link>
        </div>

        {/* Bottom: Private Hub */}
        <div className="sidebar-bottom" style={{ width: '100%' }}>
          <div style={{ height: '1px', backgroundColor: '#6B7280', width: '100%', marginBottom: '16px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ 
              fontFamily: 'var(--font-verdana), sans-serif', 
              fontSize: '13px', 
              color: '#C8C7C7'
            }}>
              Private Hub
            </span>
            <button className="private-hub-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: Private Hub
      <div className="sidebar-bottom">
        <button className="private-hub-btn">PRIVATE HUB +</button>
      </div> */}
    </aside>
  );
}

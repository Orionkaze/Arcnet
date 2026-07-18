"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const [activeItem, setActiveItem] = React.useState("consulting");
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleSignOut = async () => {
    onClose();
    await logout();
    router.push("/login");
  };

  const handleItemClick = (id: string) => {
    setActiveItem(id);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      )}

      {/* Panel */}
      <div className={`drawer-panel ${isOpen ? "open" : ""}`}>
        {/* Close button */}
        <button className="drawer-close-btn" onClick={onClose} aria-label="Close menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="drawer-content">
          {/* PUBLIC HUBS */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-label">PUBLIC HUBS</span>
              <span className="sidebar-section-line" />
            </div>

            <Link
              href="/hub/consulting"
              className={`sidebar-item ${activeItem === "consulting" ? "active" : ""}`}
              onClick={() => handleItemClick("consulting")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                <path d="M2 12h20" />
              </svg>
              <span>Consulting &amp; Cases</span>
            </Link>

            <Link
              href="/hub/finance"
              className={`sidebar-item ${activeItem === "finance" ? "active" : ""}`}
              onClick={() => handleItemClick("finance")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              <span>Finance &amp; IB</span>
            </Link>

            <Link
              href="/hub/product"
              className={`sidebar-item ${activeItem === "product" ? "active" : ""}`}
              onClick={() => handleItemClick("product")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <span>Product &amp; PM</span>
            </Link>

            <Link
              href="/hub/data"
              className={`sidebar-item ${activeItem === "data" ? "active" : ""}`}
              onClick={() => handleItemClick("data")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Data &amp; Analytics</span>
            </Link>

            <Link
              href="/hub/aptitude"
              className={`sidebar-item ${activeItem === "aptitude" ? "active" : ""}`}
              onClick={() => handleItemClick("aptitude")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12,2 2,7 12,12 22,7" />
                <path d="M2 7v6c0 3 4.5 6 10 6s10-3 10-6V7" />
                <path d="M22 7v8" />
              </svg>
              <span>Aptitude &amp; Placements</span>
            </Link>
          </div>

          {/* ECOSYSTEM */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-label">ECOSYSTEM</span>
              <span className="sidebar-section-line" />
            </div>

            <Link
              href="/caliber"
              className={`sidebar-item ${activeItem === "practice" ? "active" : ""}`}
              onClick={() => handleItemClick("practice")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span>Practice</span>
            </Link>

            <Link
              href="/caliber/competitions"
              className={`sidebar-item ${activeItem === "competitions" ? "active" : ""}`}
              onClick={() => handleItemClick("competitions")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H3a1 1 0 01-1-1V5a1 1 0 011-1h3" />
                <path d="M18 9h3a1 1 0 001-1V5a1 1 0 00-1-1h-3" />
                <path d="M6 4h12v6a6 6 0 01-12 0V4z" />
                <path d="M12 16v2" />
                <path d="M8 22h8" />
                <path d="M8 22v-4M16 22v-4" />
              </svg>
              <span>Competitions</span>
            </Link>

            <Link
              href="/ecosystem/find-team"
              className={`sidebar-item ${activeItem === "find-team" ? "active" : ""}`}
              onClick={() => handleItemClick("find-team")}
            >
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
              className={`sidebar-item ${activeItem === "mentors" ? "active" : ""}`}
              onClick={() => handleItemClick("mentors")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12,2 2,7 12,12 22,7" />
                <path d="M2 7v6c0 3 4.5 6 10 6s10-3 10-6V7" />
                <path d="M22 7v8" />
              </svg>
              <span>Mentors</span>
            </Link>

            <Link
              href="/ecosystem/jobs"
              className={`sidebar-item ${activeItem === "jobs" ? "active" : ""}`}
              onClick={() => handleItemClick("jobs")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                <path d="M2 12h20" />
              </svg>
              <span>Jobs</span>
            </Link>

            <Link
              href="/caliber/reviews"
              className={`sidebar-item ${activeItem === "reviews" ? "active" : ""}`}
              onClick={() => handleItemClick("reviews")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              <span>Review</span>
            </Link>

            <Link
              href="/caliber/me"
              className={`sidebar-item ${activeItem === "credential" ? "active" : ""}`}
              onClick={() => handleItemClick("credential")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
              </svg>
              <span>Credential</span>
            </Link>
          </div>
        </div>

        {/* Bottom: Private Hub */}
        <div className="sidebar-bottom">
          <button className="private-hub-btn">PRIVATE HUB +</button>
          {user && (
            <button 
              onClick={handleSignOut} 
              className="w-full py-2 px-3 border border-[#2A313C] hover:border-red-500/50 hover:bg-red-500/10 text-xs font-chakra text-[#C8C7C7] hover:text-red-400 rounded transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {/* Logout icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>SIGN OUT</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

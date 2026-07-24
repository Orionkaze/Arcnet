"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CreatePrivateHubModal from "./CreatePrivateHubModal";

export default function LeftSidebar() {
  const pathname = usePathname();

  // Create-private-hub modal open state (form/submit logic lives in the modal).
  const [isCreateHubOpen, setIsCreateHubOpen] = useState(false);
  const [privateHubs, setPrivateHubs] = useState<{ id: string; slug: string; name: string }[]>([]);

  // Fetch Private Hubs
  React.useEffect(() => {
    async function fetchPrivateHubs() {
      try {
        const res = await fetch("/api/hubs/private/mine");
        if (res.ok) {
          const data = await res.json();
          setPrivateHubs(data.hubs || []);
        }
      } catch (err) {
        console.error("Failed to fetch private hubs", err);
      }
    }
    fetchPrivateHubs();
  }, []);

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
            href="/hub/consulting"
            className={`sidebar-item ${isActive("/hub/consulting") ? "active" : ""}`}
          >
            {/* Briefcase icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              <path d="M2 12h20" />
            </svg>
            <span>Consulting &amp; Cases</span>
          </Link>

          <Link
            href="/hub/finance"
            className={`sidebar-item ${isActive("/hub/finance") ? "active" : ""}`}
          >
            {/* Trending-up icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            <span>Finance &amp; IB</span>
          </Link>

          <Link
            href="/hub/product"
            className={`sidebar-item ${isActive("/hub/product") ? "active" : ""}`}
          >
            {/* Box / cube icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>Product &amp; PM</span>
          </Link>

          <Link
            href="/hub/data"
            className={`sidebar-item ${isActive("/hub/data") ? "active" : ""}`}
          >
            {/* Bar-chart icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Data &amp; Analytics</span>
          </Link>

          <Link
            href="/hub/aptitude"
            className={`sidebar-item ${isActive("/hub/aptitude") ? "active" : ""}`}
          >
            {/* Graduation-cap icon */}
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
            className={`sidebar-item ${isActive("/caliber") ? "active" : ""}`}
          >
            {/* Target icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span>Practice</span>
          </Link>

          <Link
            href="/caliber/competitions"
            className={`sidebar-item ${isActive("/caliber/competitions") ? "active" : ""}`}
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
            <span>Competitions</span>
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
            href="/caliber/reviews"
            className={`sidebar-item ${isActive("/caliber/reviews") ? "active" : ""}`}
          >
            {/* Review / checklist icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <span>Review</span>
          </Link>

          <Link
            href="/caliber/me"
            className={`sidebar-item ${isActive("/caliber/me") ? "active" : ""}`}
          >
            {/* Credential / award icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            </svg>
            <span>Credential</span>
          </Link>
        </div>

        {/* Bottom: Private Hubs */}
        <div className="sidebar-bottom" style={{ width: '100%' }}>
          <div style={{ height: '1px', backgroundColor: 'var(--c-border)', width: '100%', marginBottom: '16px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ 
              fontFamily: 'var(--font-verdana), sans-serif', 
              fontSize: '13px', 
              color: 'var(--c-text-muted)'
            }}>
              Private Hubs
            </span>
            <button className="private-hub-btn" onClick={() => setIsCreateHubOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </button>
          </div>

          {/* List joined private hubs */}
          {privateHubs.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {privateHubs.map(hub => (
                <Link
                  key={hub.id}
                  href={`/hub/${hub.slug}`}
                  className={`sidebar-item ${isActive(`/hub/${hub.slug}`) ? "active" : ""}`}
                >
                  <span className="text-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <span>{hub.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE PRIVATE HUB MODAL (shared with MobileDrawer) */}
      <CreatePrivateHubModal open={isCreateHubOpen} onClose={() => setIsCreateHubOpen(false)} />
    </aside>
  );
}

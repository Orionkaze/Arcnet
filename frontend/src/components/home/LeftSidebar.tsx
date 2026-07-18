"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LeftSidebar() {
  const pathname = usePathname();

  // Create Private Hub Modal States
  const [isCreateHubOpen, setIsCreateHubOpen] = useState(false);
  const [hubName, setHubName] = useState("");
  const [hubDesc, setHubDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdHubCode, setCreatedHubCode] = useState<string | null>(null);
  const [error, setError] = useState("");
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

  const handleCreatePrivateHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hubName.trim() || !hubDesc.trim()) return;
    setIsCreating(true);
    setError("");

    try {
      const res = await fetch("/api/hubs/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: hubName, description: hubDesc }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create hub");
      }

      const data = await res.json();
      setCreatedHubCode(data.joinCode);
      setHubName("");
      setHubDesc("");
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

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
          <div style={{ height: '1px', backgroundColor: '#6B7280', width: '100%', marginBottom: '16px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ 
              fontFamily: 'var(--font-verdana), sans-serif', 
              fontSize: '13px', 
              color: '#C8C7C7'
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

      {/* CREATE PRIVATE HUB MODAL */}
      {isCreateHubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#10141A] border border-[#2A313C] rounded-lg p-6 w-[400px] max-w-[90vw] shadow-2xl relative">
            <button
              onClick={() => {
                setIsCreateHubOpen(false);
                setCreatedHubCode(null);
              }}
              className="absolute top-4 right-4 text-[#C8C7C7] hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-chakra font-bold text-white mb-4">Create Private Hub</h2>
            
            {createdHubCode ? (
              <div className="text-center py-6">
                <div className="mb-4 text-[#10B981] flex justify-center">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.9 5.7L20 10l-6.1 1.3L12 17l-1.9-5.7L4 10l6.1-1.3z" />
                    <path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9z" opacity="0.7" />
                  </svg>
                </div>
                <h3 className="text-white font-chakra font-bold text-lg mb-2">Hub Created!</h3>
                <p className="text-[#C8C7C7] text-sm mb-6">Share this code with your friends so they can request to join:</p>
                <div className="bg-[#161c24] border border-[#2A313C] rounded px-4 py-3 text-2xl font-mono text-[#10B981] tracking-widest font-bold">
                  {createdHubCode}
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreatePrivateHub} className="space-y-4">
                {error && <div className="text-[#FF4D4D] text-sm font-chakra">{error}</div>}
                <div>
                  <label className="block text-xs font-chakra text-[#C8C7C7] mb-1 uppercase tracking-wider">
                    Hub Name
                  </label>
                  <input
                    type="text"
                    value={hubName}
                    onChange={(e) => setHubName(e.target.value)}
                    required
                    className="w-full bg-[#161c24] border border-[#2A313C] rounded p-2 text-white font-inter text-sm focus:outline-none focus:border-[#10B981] transition-colors"
                    placeholder="E.g. Secret Lair"
                  />
                </div>
                <div>
                  <label className="block text-xs font-chakra text-[#C8C7C7] mb-1 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    value={hubDesc}
                    onChange={(e) => setHubDesc(e.target.value)}
                    required
                    rows={3}
                    className="w-full bg-[#161c24] border border-[#2A313C] rounded p-2 text-white font-inter text-sm focus:outline-none focus:border-[#10B981] transition-colors resize-none"
                    placeholder="What is this hub about?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-2.5 rounded bg-[#10B981] text-[#10141A] font-chakra font-bold text-sm uppercase tracking-wider hover:bg-[#00d0e0] transition-colors mt-2 disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Hub"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

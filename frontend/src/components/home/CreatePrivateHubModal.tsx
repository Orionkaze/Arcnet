"use client";

import React, { useState } from "react";

interface CreatePrivateHubModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Create-private-hub modal, shared by the desktop LeftSidebar and the mobile
 * MobileDrawer so both surfaces offer the same working flow (POST /api/hubs/private,
 * then show the generated join code).
 */
export default function CreatePrivateHubModal({ open, onClose }: CreatePrivateHubModalProps) {
  const [hubName, setHubName] = useState("");
  const [hubDesc, setHubDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdHubCode, setCreatedHubCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleClose = () => {
    setCreatedHubCode(null);
    setError("");
    onClose();
  };

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-lg p-6 w-[400px] max-w-[90vw] shadow-2xl relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[var(--c-text-muted)] hover:text-white transition-colors"
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
            <p className="text-[var(--c-text-muted)] text-sm mb-6">Share this code with your friends so they can request to join:</p>
            <div className="bg-[var(--c-surface-2)] border border-[var(--c-border)] rounded px-4 py-3 text-2xl font-mono text-[#10B981] tracking-widest font-bold">
              {createdHubCode}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreatePrivateHub} className="space-y-4">
            {error && <div className="text-[#FF4D4D] text-sm font-chakra">{error}</div>}
            <div>
              <label className="block text-xs font-chakra text-[var(--c-text-muted)] mb-1 uppercase tracking-wider">
                Hub Name
              </label>
              <input
                type="text"
                value={hubName}
                onChange={(e) => setHubName(e.target.value)}
                required
                className="w-full bg-[var(--c-surface-2)] border border-[var(--c-border)] rounded p-2 text-white font-inter text-sm focus:outline-none focus:border-[#10B981] transition-colors"
                placeholder="E.g. Case Prep Crew"
              />
            </div>
            <div>
              <label className="block text-xs font-chakra text-[var(--c-text-muted)] mb-1 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={hubDesc}
                onChange={(e) => setHubDesc(e.target.value)}
                required
                rows={3}
                className="w-full bg-[var(--c-surface-2)] border border-[var(--c-border)] rounded p-2 text-white font-inter text-sm focus:outline-none focus:border-[#10B981] transition-colors resize-none"
                placeholder="What is this hub about?"
              />
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-2.5 rounded bg-[#10B981] text-[var(--c-surface)] font-chakra font-bold text-sm uppercase tracking-wider hover:bg-[#00d0e0] transition-colors mt-2 disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Hub"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

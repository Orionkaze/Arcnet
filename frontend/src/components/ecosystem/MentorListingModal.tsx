"use client";

import React, { useState } from "react";
import { LABEL, FIELD, TEXTAREA, SUBMIT, OVERLAY, CARD } from "./formStyles";

const SPECIALTIES = ["Consulting", "Finance", "Product", "Data", "Aptitude"];

export interface MentorDraft {
  id?: string;
  firstName: string;
  lastName: string;
  role: string;
  company: string;
  specialty: string;
  years: number | string;
  price: number | string;
  expertise: string[] | string;
  bio: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Existing listing to edit, if the viewer already has one. */
  existing?: MentorDraft | null;
  onSaved: () => void;
}

const EMPTY: MentorDraft = {
  firstName: "",
  lastName: "",
  role: "",
  company: "",
  specialty: "Consulting",
  years: "",
  price: "",
  expertise: "",
  bio: "",
};

/**
 * Create or edit your own mentor listing. POSTs /api/mentors, which upserts on
 * the signed-in user (one listing per person).
 */
export default function MentorListingModal({ open, onClose, existing, onSaved }: Props) {
  const seed: MentorDraft = existing
    ? {
        ...existing,
        expertise: Array.isArray(existing.expertise)
          ? existing.expertise.join(", ")
          : existing.expertise,
      }
    : EMPTY;

  // Re-seed whenever the modal is opened for a different listing.
  const [form, setForm] = useState<MentorDraft>(seed);
  const [seededFor, setSeededFor] = useState<string | null>(existing?.id ?? null);
  if (open && (existing?.id ?? null) !== seededFor) {
    setSeededFor(existing?.id ?? null);
    setForm(seed);
  }

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof MentorDraft, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          years: Number(form.years),
          price: Number(form.price),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save your listing.");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Could not save your listing.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className={OVERLAY}>
      <div className={CARD}>
        <button
          onClick={() => { setError(""); onClose(); }}
          aria-label="Close"
          className="absolute top-4 right-4 text-[var(--c-text-muted)] hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-xl font-chakra font-bold text-white mb-4">
          {existing ? "Edit your listing" : "Become a Mentor"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-[#FF4D4D] text-sm font-chakra">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>First name</label>
              <input className={FIELD} value={form.firstName} required
                onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Last name</label>
              <input className={FIELD} value={form.lastName} required
                onChange={(e) => set("lastName", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Current role</label>
              <input className={FIELD} value={form.role} required
                onChange={(e) => set("role", e.target.value)}
                placeholder="E.g. Senior Product Manager" />
            </div>
            <div>
              <label className={LABEL}>Company</label>
              <input className={FIELD} value={form.company} required
                onChange={(e) => set("company", e.target.value)}
                placeholder="E.g. Flipkart" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Specialty</label>
              <select className={FIELD} value={form.specialty}
                onChange={(e) => set("specialty", e.target.value)}>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Years</label>
              <input className={FIELD} type="number" min="0" max="60" required
                value={form.years}
                onChange={(e) => set("years", e.target.value)}
                placeholder="8" />
            </div>
            <div>
              <label className={LABEL}>₹ / 45 min</label>
              <input className={FIELD} type="number" min="0" required
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="1500" />
            </div>
          </div>

          <div>
            <label className={LABEL}>Expertise (comma separated)</label>
            <input className={FIELD}
              value={typeof form.expertise === "string" ? form.expertise : form.expertise.join(", ")}
              onChange={(e) => set("expertise", e.target.value)}
              placeholder="E.g. Product Sense, Metrics, Prioritization" />
          </div>

          <div>
            <label className={LABEL}>Short bio</label>
            <textarea className={TEXTAREA} rows={3} value={form.bio} required
              onChange={(e) => set("bio", e.target.value)}
              placeholder="What can mentees expect from a session with you?" />
          </div>

          <button type="submit" disabled={submitting} className={SUBMIT}>
            {submitting ? "Saving…" : "Save listing"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { LABEL, FIELD, TEXTAREA, SUBMIT, OVERLAY, CARD } from "./formStyles";

export type EmploymentType = "Full-Time" | "Internship" | "Contract" | "Remote";

const EMPLOYMENT_TYPES: EmploymentType[] = [
  "Full-Time",
  "Internship",
  "Contract",
  "Remote",
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after a role is created so the board can refetch. */
  onCreated: () => void;
}

const EMPTY = {
  title: "",
  company: "",
  location: "",
  type: "Full-Time" as EmploymentType,
  ctc: "",
  skills: "",
  description: "",
};

/**
 * Post a role to the job board. POSTs /api/jobs, which stamps the listing with
 * the signed-in user as its owner (so they can delete it later).
 */
export default function PostRoleModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof EMPTY, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const close = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not post the role.");
        return;
      }
      setForm(EMPTY);
      onCreated();
      onClose();
    } catch {
      setError("Could not post the role.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className={OVERLAY}>
      <div className={CARD}>
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 text-[var(--c-text-muted)] hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-xl font-chakra font-bold text-white mb-4">Post a Role</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-[#FF4D4D] text-sm font-chakra">{error}</div>}

          <div>
            <label className={LABEL}>Role title</label>
            <input className={FIELD} value={form.title} required
              onChange={(e) => set("title", e.target.value)}
              placeholder="E.g. Business Analyst" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Company</label>
              <input className={FIELD} value={form.company} required
                onChange={(e) => set("company", e.target.value)}
                placeholder="E.g. Acme Consulting" />
            </div>
            <div>
              <label className={LABEL}>Location</label>
              <input className={FIELD} value={form.location} required
                onChange={(e) => set("location", e.target.value)}
                placeholder="E.g. Bengaluru, KA" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Type</label>
              <select className={FIELD} value={form.type}
                onChange={(e) => set("type", e.target.value)}>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Compensation</label>
              <input className={FIELD} value={form.ctc} required
                onChange={(e) => set("ctc", e.target.value)}
                placeholder="E.g. ₹18-24 LPA" />
            </div>
          </div>

          <div>
            <label className={LABEL}>Skills (comma separated)</label>
            <input className={FIELD} value={form.skills}
              onChange={(e) => set("skills", e.target.value)}
              placeholder="E.g. SQL, Excel, Market Sizing" />
          </div>

          <div>
            <label className={LABEL}>Description</label>
            <textarea className={TEXTAREA} rows={4} value={form.description} required
              onChange={(e) => set("description", e.target.value)}
              placeholder="What will this person actually work on?" />
          </div>

          <button type="submit" disabled={submitting} className={SUBMIT}>
            {submitting ? "Posting…" : "Post Role"}
          </button>
        </form>
      </div>
    </div>
  );
}

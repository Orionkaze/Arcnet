"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuthStore } from "@/store/useAuthStore";
import s from "./caliber.module.css";

interface Track { id: string; slug: string; name: string; kind: string; description: string; }

export default function CaliberHome() {
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    checkAuth();
    let cancelled = false;
    fetch("/api/caliber/tracks")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) setTracks(d.tracks || []); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [checkAuth]);

  return (
    <div className="home-layout">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
      <div className="home-content relative">
        <LeftSidebar />

        <main className="center-feed">
          <div className="flex flex-col gap-2 mb-6">
            <span className="section-label">CALIBER</span>
            <h1 className="font-chakra text-2xl text-white font-bold uppercase tracking-wider">
              Practice
            </h1>
            <p className="font-inter text-sm text-[#C8C7C7]">
              Practice real problems. Get instant feedback. Build a rating that proves your ability.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <Link href="/caliber/competitions" className={s.pill}>Competitions</Link>
            <Link href="/caliber/reviews" className={s.pill}>Review Inbox</Link>
            <Link href="/caliber/me" className={s.pill}>My Credential</Link>
          </div>

          {loading ? (
            <div className={s.state}>Loading tracks…</div>
          ) : error ? (
            <div className={s.state}>Could not load tracks.</div>
          ) : tracks.length === 0 ? (
            <div className={s.state}>No tracks yet.</div>
          ) : (
            tracks.map((t) => (
              <Link key={t.id} href={`/caliber/tracks/${t.slug}`} className={s.card}>
                <div className={s.rowBetween}>
                  <strong>{t.name}</strong>
                  <span className={s.pill}>{t.kind}</span>
                </div>
                <div className={s.muted}>{t.description}</div>
              </Link>
            ))
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
          color: rgba(16, 185, 129, 0.6);
        }
      `}</style>
    </div>
  );
}

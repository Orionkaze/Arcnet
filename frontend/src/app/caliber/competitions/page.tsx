"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuthStore } from "@/store/useAuthStore";
import s from "../caliber.module.css";

interface Comp { id: string; slug: string; name: string; description: string; state: string; }

export default function CompetitionsPage() {
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [comps, setComps] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    checkAuth();
    let c = false;
    fetch("/api/caliber/competitions").then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!c) setComps(d.competitions || []); })
      .catch(() => { if (!c) setError(true); }).finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [checkAuth]);
  return (
    <div className="home-layout">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
      <div className="home-content relative">
        <LeftSidebar />

        <main className="center-feed">
          <div className="flex flex-col gap-2 mb-6">
            <Link href="/caliber" className={s.muted}>← Caliber</Link>
            <span className="section-label">CALIBER</span>
            <h1 className="font-chakra text-2xl text-white font-bold uppercase tracking-wider">
              Competitions
            </h1>
          </div>

          {loading ? <div className={s.state}>Loading…</div>
            : error ? <div className={s.state}>Could not load competitions.</div>
            : comps.length === 0 ? <div className={s.state}>No competitions yet.</div>
            : comps.map((c) => (
              <Link key={c.id} href={`/caliber/competitions/${c.slug}`} className={s.card}>
                <div className={s.rowBetween}><strong>{c.name}</strong><span className={s.pill}>{c.state}</span></div>
                <div className={s.muted}>{c.description}</div>
              </Link>
            ))}
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

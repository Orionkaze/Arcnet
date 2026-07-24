"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import "../../../home.css";
import Navbar from "@/components/home/Navbar";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightPanel from "@/components/home/RightPanel";
import MobileBottomNav from "@/components/home/MobileBottomNav";
import MobileDrawer from "@/components/home/MobileDrawer";
import { useAuthStore } from "@/store/useAuthStore";
import s from "../../caliber.module.css";

interface PublicProblem { id: string; type: string; prompt: string; difficulty: number; maxPoints: number; isOpen?: boolean; }

export default function TrackPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [problems, setProblems] = useState<PublicProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    checkAuth();
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/caliber/tracks/${slug}/problems`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) { setName(d.track?.name || slug); setProblems(d.problems || []); } })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, checkAuth]);

  return (
    <div className="home-layout">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
      <div className="home-content relative">
        <LeftSidebar />

        <main className="center-feed">
          <div className="flex flex-col gap-2 mb-6">
            <Link href="/caliber" className={s.muted}>← Tracks</Link>
            <span className="section-label">CALIBER TRACK</span>
            <h1 className="font-chakra text-2xl text-white font-bold uppercase tracking-wider">
              {name || "Track"}
            </h1>
          </div>

          {loading ? (
            <div className={s.state}>Loading…</div>
          ) : error ? (
            <div className={s.state}>Could not load problems.</div>
          ) : problems.length === 0 ? (
            <div className={s.state}>No problems in this track yet.</div>
          ) : (
            problems.map((p) => (
              <Link key={p.id} href={p.isOpen ? `/caliber/open/${p.id}` : `/caliber/problems/${p.id}`} className={s.card}>
                <div className={s.rowBetween}>
                  <span>{p.prompt}</span>
                  <span className={s.pill}>{p.isOpen ? "PEER REVIEWED" : p.difficulty}</span>
                </div>
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

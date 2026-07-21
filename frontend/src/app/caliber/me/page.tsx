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

interface Rating { trackId: string; value: number; trackName?: string; trackSlug?: string | null; }
interface OpenSub { id: string; status: string; score: number | null; problem: { id: string; prompt: string; maxPoints: number }; }

export default function CredentialPage() {
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [subs, setSubs] = useState<OpenSub[]>([]);
  const [authed, setAuthed] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    let c = false;
    (async () => {
      const [r1, r2] = await Promise.all([
        fetch("/api/caliber/me/ratings"),
        fetch("/api/caliber/me/open-submissions"),
      ]);
      if (r1.status === 401) { if (!c) { setAuthed(false); setLoading(false); } return; }
      const d1 = await r1.json().catch(() => ({ ratings: [] }));
      const d2 = r2.ok ? await r2.json().catch(() => ({ submissions: [] })) : { submissions: [] };
      if (!c) { setRatings(d1.ratings || []); setSubs(d2.submissions || []); setLoading(false); }
    })();
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
              Your Credential
            </h1>
            <p className="font-inter text-sm text-[#C8C7C7]">
              Ratings earned from deterministic practice — a portable signal of ability.
            </p>
          </div>

          {loading ? (
            <div className={s.state}>Loading…</div>
          ) : !authed ? (
            <div className={s.state}>Log in to see your credential.</div>
          ) : (
            <>
              <h2 className={s.h1} style={{ fontSize: "1.15rem", marginTop: ".5rem" }}>Ratings</h2>
              {ratings.length === 0 ? <div className={s.muted}>No ratings yet. <Link href="/caliber" className={s.muted}>Start practicing →</Link></div>
                : ratings.map((r) => (
                  <div key={r.trackId} className={s.card} style={{ cursor: "default" }}>
                    <div className={s.rowBetween}><span className={s.muted}>{r.trackName ?? r.trackId}</span><strong>{r.value}</strong></div>
                  </div>
                ))}

              <h2 className={s.h1} style={{ fontSize: "1.15rem", marginTop: "2rem" }}>Open submissions</h2>
              {subs.length === 0 ? <div className={s.muted}>None yet.</div> : subs.map((x) => (
                <div key={x.id} className={s.card} style={{ cursor: "default" }}>
                  <div className={s.rowBetween}>
                    <span>{x.problem.prompt}</span>
                    <span className={s.muted}>{x.status === "scored" ? `${x.score}/${x.problem.maxPoints}` : "pending review"}</span>
                  </div>
                </div>
              ))}
            </>
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

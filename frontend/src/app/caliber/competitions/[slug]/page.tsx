"use client";

import { useCallback, useEffect, useState } from "react";
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
import CompetitionSolveCard, { type CompetitionProblem } from "../../components/CompetitionSolveCard";

type PublicProblem = CompetitionProblem;
interface Detail {
  competition: { slug: string; name: string; description: string; state: string };
  problems: PublicProblem[];
  joined?: boolean;
  answeredProblemIds?: string[];
}
interface Row { rank: number; score: number; user?: { username: string | null; firstName: string; lastName: string } | null; }

export default function CompetitionDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { checkAuth } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [board, setBoard] = useState<Row[]>([]);
  const [joined, setJoined] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const [d, b] = await Promise.all([
        fetch(`/api/caliber/competitions/${slug}`).then((r) => (r.ok ? r.json() : Promise.reject())),
        fetch(`/api/caliber/competitions/${slug}/leaderboard`).then((r) => (r.ok ? r.json() : { leaderboard: [] })),
      ]);
      setDetail(d); setBoard(b.leaderboard || []);
      if (d.joined) setJoined(true);
    } catch { setDetail(null); } finally { setLoading(false); }
  }, [slug]);

  const reloadBoard = useCallback(async () => {
    if (!slug) return;
    try {
      const b = await fetch(`/api/caliber/competitions/${slug}/leaderboard`).then((r) => (r.ok ? r.json() : { leaderboard: [] }));
      setBoard(b.leaderboard || []);
    } catch { /* leaderboard refresh is best-effort */ }
  }, [slug]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { checkAuth(); load(); }, [load, checkAuth]);

  async function join() {
    setMsg(null);
    const r = await fetch(`/api/caliber/competitions/${slug}/join`, { method: "POST" });
    if (r.status === 401) { setMsg("Log in to join."); return; }
    if (!r.ok) { const e = await r.json().catch(() => ({})); setMsg(e.error || "Could not join."); return; }
    setJoined(true); setMsg("You're in!");
  }

  return (
    <div className="home-layout">
      <Navbar onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)} />
      <div className="home-content relative">
        <LeftSidebar />

        <main className="center-feed">
          {loading ? (
            <div className={s.state}>Loading…</div>
          ) : !detail ? (
            <div className={s.state}>Competition not found.</div>
          ) : (
            <>
              <div className="flex flex-col gap-2 mb-6">
                <Link href="/caliber/competitions" className={s.muted}>← Competitions</Link>
                <span className="section-label">CALIBER COMPETITION</span>
                <div className={s.rowBetween}>
                  <h1 className="font-chakra text-2xl text-white font-bold uppercase tracking-wider">
                    {detail.competition.name}
                  </h1>
                  <span className={s.pill}>{detail.competition.state}</span>
                </div>
                <p className="font-inter text-sm text-[var(--c-text-muted)]">{detail.competition.description}</p>
              </div>

              {detail.competition.state !== "ended" && (
                <button className={s.btn} onClick={join} disabled={joined}>{joined ? "Joined" : "Join"}</button>
              )}
              {msg && <p className={s.muted} style={{ marginTop: ".5rem" }}>{msg}</p>}

              <h2 className={s.h1} style={{ fontSize: "1.15rem", marginTop: "2rem" }}>Problems</h2>
              {detail.problems.length === 0 ? (
                <div className={s.muted}>{detail.competition.state === "upcoming" ? "Revealed when the competition starts." : "No problems."}</div>
              ) : detail.problems.map((p) => (
                <CompetitionSolveCard
                  key={p.id}
                  slug={slug as string}
                  problem={p}
                  joined={joined}
                  live={detail.competition.state === "live"}
                  alreadyAnswered={(detail.answeredProblemIds ?? []).includes(p.id)}
                  onScored={reloadBoard}
                />
              ))}

              <h2 className={s.h1} style={{ fontSize: "1.15rem", marginTop: "2rem" }}>Leaderboard</h2>
              {board.length === 0 ? <div className={s.muted}>No entries yet.</div> : board.map((r) => (
                <div key={r.rank + (r.user?.username ?? "")} className={s.card} style={{ cursor: "default" }}>
                  <div className={s.rowBetween}>
                    <span>#{r.rank} &nbsp; {r.user ? `${r.user.firstName} ${r.user.lastName}` : "Unknown"}</span>
                    <strong>{r.score}</strong>
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

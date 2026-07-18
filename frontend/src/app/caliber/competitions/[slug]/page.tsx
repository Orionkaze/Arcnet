"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import s from "../../caliber.module.css";

interface PublicProblem { id: string; type: string; prompt: string; difficulty: number; maxPoints: number; }
interface Detail { competition: { slug: string; name: string; description: string; state: string }; problems: PublicProblem[]; }
interface Row { rank: number; score: number; user?: { username: string | null; firstName: string; lastName: string } | null; }

export default function CompetitionDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
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
    } catch { setDetail(null); } finally { setLoading(false); }
  }, [slug]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function join() {
    setMsg(null);
    const r = await fetch(`/api/caliber/competitions/${slug}/join`, { method: "POST" });
    if (r.status === 401) { setMsg("Log in to join."); return; }
    if (!r.ok) { const e = await r.json().catch(() => ({})); setMsg(e.error || "Could not join."); return; }
    setJoined(true); setMsg("You're in!");
  }

  if (loading) return <div className={s.wrap}><div className={s.state}>Loading…</div></div>;
  if (!detail) return <div className={s.wrap}><div className={s.state}>Competition not found.</div></div>;

  return (
    <div className={s.wrap}>
      <Link href="/caliber/competitions" className={s.muted}>← Competitions</Link>
      <div className={s.rowBetween} style={{ marginTop: ".5rem" }}>
        <h1 className={s.h1}>{detail.competition.name}</h1>
        <span className={s.pill}>{detail.competition.state}</span>
      </div>
      <p className={s.sub}>{detail.competition.description}</p>

      {detail.competition.state !== "ended" && (
        <button className={s.btn} onClick={join} disabled={joined}>{joined ? "Joined" : "Join"}</button>
      )}
      {msg && <p className={s.muted} style={{ marginTop: ".5rem" }}>{msg}</p>}

      <h2 className={s.h1} style={{ fontSize: "1.15rem", marginTop: "2rem" }}>Problems</h2>
      {detail.problems.length === 0 ? (
        <div className={s.muted}>{detail.competition.state === "upcoming" ? "Revealed when the competition starts." : "No problems."}</div>
      ) : detail.problems.map((p) => (
        <div key={p.id} className={s.card} style={{ cursor: "default" }}>
          <div className={s.rowBetween}><span>{p.prompt}</span><span className={s.pill}>{p.difficulty}</span></div>
        </div>
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
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import s from "../caliber.module.css";

interface Rating { trackId: string; value: number; }
interface OpenSub { id: string; status: string; score: number | null; problem: { id: string; prompt: string; maxPoints: number }; }

export default function CredentialPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [subs, setSubs] = useState<OpenSub[]>([]);
  const [authed, setAuthed] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading) return <div className={s.wrap}><div className={s.state}>Loading…</div></div>;
  if (!authed) return <div className={s.wrap}><div className={s.state}>Log in to see your credential.</div></div>;

  return (
    <div className={s.wrap}>
      <h1 className={s.h1}>Your Credential</h1>
      <p className={s.sub}>Ratings earned from deterministic practice — a portable signal of ability.</p>

      <h2 className={s.h1} style={{ fontSize: "1.15rem", marginTop: "1.5rem" }}>Ratings</h2>
      {ratings.length === 0 ? <div className={s.muted}>No ratings yet. <Link href="/caliber" className={s.muted}>Start practicing →</Link></div>
        : ratings.map((r) => (
          <div key={r.trackId} className={s.card} style={{ cursor: "default" }}>
            <div className={s.rowBetween}><span className={s.muted}>{r.trackId}</span><strong>{r.value}</strong></div>
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
    </div>
  );
}

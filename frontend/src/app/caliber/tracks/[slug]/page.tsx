"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import s from "../../caliber.module.css";

interface PublicProblem { id: string; type: string; prompt: string; difficulty: number; maxPoints: number; }

export default function TrackPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [name, setName] = useState("");
  const [problems, setProblems] = useState<PublicProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/caliber/tracks/${slug}/problems`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) { setName(d.track?.name || slug); setProblems(d.problems || []); } })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div className={s.wrap}>
      <Link href="/caliber" className={s.muted}>← Tracks</Link>
      <h1 className={s.h1} style={{ marginTop: ".5rem" }}>{name || "Track"}</h1>
      {loading ? (
        <div className={s.state}>Loading…</div>
      ) : error ? (
        <div className={s.state}>Could not load problems.</div>
      ) : problems.length === 0 ? (
        <div className={s.state}>No problems in this track yet.</div>
      ) : (
        problems.map((p) => (
          <Link key={p.id} href={`/caliber/problems/${p.id}`} className={s.card}>
            <div className={s.rowBetween}>
              <span>{p.prompt}</span>
              <span className={s.pill}>{p.difficulty}</span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

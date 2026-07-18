"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import s from "./caliber.module.css";

interface Track { id: string; slug: string; name: string; kind: string; description: string; }

export default function CaliberHome() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/caliber/tracks")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) setTracks(d.tracks || []); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={s.wrap}>
      <h1 className={s.h1}>Caliber</h1>
      <p className={s.sub}>Practice real problems. Get instant feedback. Build a rating that proves your ability.</p>
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
    </div>
  );
}

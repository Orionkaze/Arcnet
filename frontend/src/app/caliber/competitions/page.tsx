"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import s from "../caliber.module.css";

interface Comp { id: string; slug: string; name: string; description: string; state: string; }

export default function CompetitionsPage() {
  const [comps, setComps] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let c = false;
    fetch("/api/caliber/competitions").then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!c) setComps(d.competitions || []); })
      .catch(() => { if (!c) setError(true); }).finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, []);
  return (
    <div className={s.wrap}>
      <Link href="/caliber" className={s.muted}>← Caliber</Link>
      <h1 className={s.h1} style={{ marginTop: ".5rem" }}>Competitions</h1>
      {loading ? <div className={s.state}>Loading…</div>
        : error ? <div className={s.state}>Could not load competitions.</div>
        : comps.length === 0 ? <div className={s.state}>No competitions yet.</div>
        : comps.map((c) => (
          <Link key={c.id} href={`/caliber/competitions/${c.slug}`} className={s.card}>
            <div className={s.rowBetween}><strong>{c.name}</strong><span className={s.pill}>{c.state}</span></div>
            <div className={s.muted}>{c.description}</div>
          </Link>
        ))}
    </div>
  );
}

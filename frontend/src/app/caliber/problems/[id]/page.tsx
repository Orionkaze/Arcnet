"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import s from "../../caliber.module.css";
import SolveCard, { type PublicProblem } from "../../components/SolveCard";

export default function ProblemPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [problem, setProblem] = useState<PublicProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/caliber/problems/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) setProblem(d.problem); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className={s.wrap}>
      <Link href="/caliber" className={s.muted}>← Tracks</Link>
      <div style={{ marginTop: ".75rem" }}>
        {loading ? (
          <div className={s.state}>Loading…</div>
        ) : error || !problem ? (
          <div className={s.state}>Problem not found.</div>
        ) : (
          <SolveCard problem={problem} />
        )}
      </div>
    </div>
  );
}

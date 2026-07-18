"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import s from "../../caliber.module.css";

interface Criterion { key: string; label: string; maxPoints: number; }
interface OpenProblem { id: string; prompt: string; rubric: Criterion[]; maxPoints: number; }

export default function OpenSolvePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [problem, setProblem] = useState<OpenProblem | null>(null);
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let c = false;
    fetch(`/api/caliber/open/${id}`).then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!c) setProblem(d.problem); })
      .catch(() => { if (!c) setProblem(null); }).finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [id]);

  async function submit() {
    setMsg(null);
    const r = await fetch(`/api/caliber/open/${id}/submit`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer }),
    });
    if (r.status === 401) { setMsg("Log in to submit."); return; }
    if (!r.ok) { const e = await r.json().catch(() => ({})); setMsg(e.error || "Submission failed."); return; }
    setDone(true); setMsg("Submitted — it will be scored by peer review.");
  }

  if (loading) return <div className={s.wrap}><div className={s.state}>Loading…</div></div>;
  if (!problem) return <div className={s.wrap}><div className={s.state}>Problem not found.</div></div>;

  return (
    <div className={s.wrap}>
      <Link href="/caliber" className={s.muted}>← Caliber</Link>
      <h1 className={s.h1} style={{ marginTop: ".5rem" }}>Open Problem</h1>
      <p style={{ fontSize: "1.05rem" }}>{problem.prompt}</p>
      <div className={s.card} style={{ cursor: "default" }}>
        <strong className={s.muted}>Rubric ({problem.maxPoints} pts)</strong>
        {problem.rubric.map((c) => (
          <div key={c.key} className={s.rowBetween}><span>{c.label}</span><span className={s.muted}>{c.maxPoints}</span></div>
        ))}
      </div>
      <textarea className={s.input} style={{ minHeight: 200, marginTop: "1rem" }} value={answer}
        onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer" disabled={done} />
      {!done && <button className={s.btn} style={{ marginTop: "1rem" }} onClick={submit} disabled={!answer.trim()}>Submit</button>}
      {msg && <p className={s.muted} style={{ marginTop: ".75rem" }}>{msg}</p>}
    </div>
  );
}

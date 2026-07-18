"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import s from "../caliber.module.css";

interface Criterion { key: string; label: string; maxPoints: number; }
interface Task { id: string; answer: string; problem: { id: string; prompt: string; rubric: Criterion[]; maxPoints: number }; }

export default function ReviewInbox() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/caliber/reviews/queue");
    if (r.status === 401) { setAuthed(false); setLoading(false); return; }
    const d = await r.json().catch(() => ({ tasks: [] }));
    const loaded: Task[] = d.tasks || [];
    setTasks(loaded);
    // Seed every criterion to 0 so an untouched criterion submits 0 (not missing).
    setScores((prev) => {
      const next = { ...prev };
      for (const t of loaded) {
        next[t.id] = { ...Object.fromEntries(t.problem.rubric.map((c) => [c.key, 0])), ...next[t.id] };
      }
      return next;
    });
    setLoading(false);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  function setScore(taskId: string, key: string, v: number) {
    setScores((prev) => ({ ...prev, [taskId]: { ...prev[taskId], [key]: v } }));
  }

  async function submitReview(t: Task) {
    setMsg(null);
    const r = await fetch(`/api/caliber/reviews/${t.id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scores: scores[t.id] || {} }),
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); setMsg(e.error || "Review failed."); return; }
    setTasks((prev) => prev.filter((x) => x.id !== t.id)); setMsg("Review submitted.");
  }

  if (loading) return <div className={s.wrap}><div className={s.state}>Loading…</div></div>;
  if (!authed) return <div className={s.wrap}><div className={s.state}>Log in to review peers.</div></div>;

  return (
    <div className={s.wrap}>
      <Link href="/caliber" className={s.muted}>← Caliber</Link>
      <h1 className={s.h1} style={{ marginTop: ".5rem" }}>Review Inbox</h1>
      {msg && <p className={s.muted}>{msg}</p>}
      {tasks.length === 0 ? <div className={s.state}>Nothing to review right now.</div> : tasks.map((t) => (
        <div key={t.id} className={s.card} style={{ cursor: "default" }}>
          <div className={s.muted}>{t.problem.prompt}</div>
          <p style={{ whiteSpace: "pre-wrap", margin: ".5rem 0" }}>{t.answer}</p>
          {t.problem.rubric.map((c) => (
            <div key={c.key} className={s.rowBetween}>
              <span>{c.label} (0–{c.maxPoints})</span>
              <input className={s.input} style={{ width: 90 }} type="number" min={0} max={c.maxPoints}
                value={scores[t.id]?.[c.key] ?? 0}
                onChange={(e) => setScore(t.id, c.key, Number(e.target.value))} />
            </div>
          ))}
          <button className={s.btn} style={{ marginTop: ".75rem" }} onClick={() => submitReview(t)}>Submit review</button>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import s from "../caliber.module.css";
import { inputKindForProblem, type InputKind } from "../lib/inputKind";
import type { ProblemType } from "@/lib/caliber/evaluation/types";

export interface CompetitionProblem {
  id: string; type: ProblemType; prompt: string; difficulty: number; maxPoints: number; optionCount?: number;
}

interface SubmitResponse {
  result: { score: number; maxPoints: number; feedback: string };
}

interface Props {
  slug: string;
  problem: CompetitionProblem;
  /** Viewer has joined the competition — required before submitting. */
  joined: boolean;
  /** Competition is currently live — submissions are only accepted then. */
  live: boolean;
  /** Viewer already submitted an answer for this problem (one attempt only). */
  alreadyAnswered: boolean;
  /** Called after a successful submit so the parent can refresh the leaderboard. */
  onScored?: () => void;
}

/**
 * Solve form for a problem inside a competition. Unlike the practice SolveCard
 * this posts to the competition submit endpoint, which scores toward the
 * leaderboard rather than the user's per-track rating, and allows one attempt.
 */
export default function CompetitionSolveCard({ slug, problem, joined, live, alreadyAnswered, onScored }: Props) {
  const kind: InputKind = inputKindForProblem(problem.type);
  const [numberValue, setNumberValue] = useState("");
  const [choice, setChoice] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resp, setResp] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answered, setAnswered] = useState(alreadyAnswered);

  const canSubmit = kind === "number"
    ? numberValue.trim() !== "" && Number.isFinite(Number(numberValue))
    : choice !== null;

  const locked = answered || !!resp || !live || !joined;

  async function submit() {
    setSubmitting(true); setError(null);
    const value = kind === "number" ? Number(numberValue) : choice;
    try {
      const r = await fetch(`/api/caliber/competitions/${slug}/problems/${problem.id}/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }),
      });
      if (r.status === 401) { setError("Log in to submit."); return; }
      if (r.status === 403) { setError("Join the competition first."); return; }
      if (r.status === 409) { setAnswered(true); setError("You already answered this problem."); return; }
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setError(e.error || "Submission failed.");
        return;
      }
      setResp(await r.json());
      onScored?.();
    } catch { setError("Submission failed."); }
    finally { setSubmitting(false); }
  }

  return (
    <div>
      <div className={s.card} style={{ cursor: "default" }}>
        <div className={s.rowBetween}>
          <span className={s.pill}>{problem.type}</span>
          <span className={s.muted}>Difficulty {problem.difficulty}</span>
        </div>
        <p style={{ margin: ".75rem 0 1rem", fontSize: "1.05rem" }}>{problem.prompt}</p>

        {kind === "number" ? (
          <input
            className={s.input}
            inputMode="decimal"
            aria-label="Your answer"
            placeholder="Your answer"
            value={numberValue}
            onChange={(e) => setNumberValue(e.target.value)}
            disabled={locked}
          />
        ) : (
          <div>
            {Array.from({ length: problem.optionCount ?? 0 }).map((_, i) => (
              <button
                key={i}
                className={`${s.choice} ${choice === i ? s.choiceSel : ""}`}
                aria-pressed={choice === i}
                onClick={() => setChoice(i)}
                disabled={locked}
              >
                Option {i + 1}
              </button>
            ))}
          </div>
        )}

        {!resp && !answered && live && joined && (
          <button className={s.btn} style={{ marginTop: "1rem" }} onClick={submit} disabled={!canSubmit || submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        )}
        {!joined && live && <p className={s.muted} style={{ marginTop: ".75rem" }}>Join the competition to answer.</p>}
        {!live && <p className={s.muted} style={{ marginTop: ".75rem" }}>Submissions are closed.</p>}
        {answered && !resp && <p className={s.muted} style={{ marginTop: ".75rem" }}>Answer submitted.</p>}
        {error && <p className={s.muted} style={{ marginTop: ".75rem" }}>{error}</p>}
      </div>

      {resp && (
        <div className={s.result}>
          <div className={s.rowBetween}>
            <strong>{resp.result.score} / {resp.result.maxPoints}</strong>
            <span className={s.muted}>Counted toward the leaderboard</span>
          </div>
          <p style={{ margin: ".5rem 0 0" }}>{resp.result.feedback}</p>
        </div>
      )}
    </div>
  );
}

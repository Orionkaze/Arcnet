"use client";

import { useState } from "react";
import s from "../caliber.module.css";
import { inputKindForProblem, type InputKind } from "../lib/inputKind";
import type { ProblemType } from "@/lib/caliber/evaluation/types";

export interface PublicProblem {
  id: string; type: ProblemType; prompt: string; difficulty: number; maxPoints: number; optionCount?: number;
}
interface SubmitResponse {
  result: { score: number; maxPoints: number; feedback: string };
  rating: number; ratingDelta: number; countedForRating: boolean;
}

export default function SolveCard({ problem }: { problem: PublicProblem }) {
  const kind: InputKind = inputKindForProblem(problem.type);
  const [numberValue, setNumberValue] = useState("");
  const [choice, setChoice] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resp, setResp] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = kind === "number" ? numberValue.trim() !== "" && Number.isFinite(Number(numberValue)) : choice !== null;

  async function submit() {
    setSubmitting(true); setError(null);
    const value = kind === "number" ? Number(numberValue) : choice;
    try {
      const r = await fetch(`/api/caliber/problems/${problem.id}/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }),
      });
      if (r.status === 401) { setError("Log in to submit and earn a rating."); return; }
      if (!r.ok) { setError("Submission failed."); return; }
      setResp(await r.json());
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
            disabled={!!resp}
          />
        ) : (
          <div>
            {Array.from({ length: problem.optionCount ?? 0 }).map((_, i) => (
              <button
                key={i}
                className={`${s.choice} ${choice === i ? s.choiceSel : ""}`}
                aria-pressed={choice === i}
                onClick={() => setChoice(i)}
                disabled={!!resp}
              >
                Option {i + 1}
              </button>
            ))}
          </div>
        )}

        {!resp && (
          <button className={s.btn} style={{ marginTop: "1rem" }} onClick={submit} disabled={!canSubmit || submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        )}
        {error && <p className={s.muted} style={{ marginTop: ".75rem" }}>{error}</p>}
      </div>

      {resp && (
        <div className={s.result}>
          <div className={s.rowBetween}>
            <strong>{resp.result.score} / {resp.result.maxPoints}</strong>
            {resp.countedForRating ? (
              <span className={`${s.delta} ${resp.ratingDelta >= 0 ? s.deltaUp : s.deltaDown}`}>
                {resp.ratingDelta >= 0 ? "+" : ""}{resp.ratingDelta} → {resp.rating}
              </span>
            ) : (
              <span className={s.muted}>Practice (rating unchanged)</span>
            )}
          </div>
          <p style={{ margin: ".5rem 0 0" }}>{resp.result.feedback}</p>
        </div>
      )}
    </div>
  );
}

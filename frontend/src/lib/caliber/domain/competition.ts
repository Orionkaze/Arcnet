export type CompetitionState = "upcoming" | "live" | "ended";

export function competitionState(now: number, startsAt: number, endsAt: number): CompetitionState {
  if (now < startsAt) return "upcoming";
  if (now <= endsAt) return "live";
  return "ended";
}

export interface LeaderboardRow { userId: string; score: number; lastAt: number; }
export interface RankedRow extends LeaderboardRow { rank: number; }

export function rankLeaderboard(rows: LeaderboardRow[]): RankedRow[] {
  const sorted = [...rows].sort((a, b) => (b.score - a.score) || (a.lastAt - b.lastAt));
  const ranked: RankedRow[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const tied = prev && prev.score === cur.score && prev.lastAt === cur.lastAt;
    ranked.push({ ...cur, rank: tied ? ranked[i - 1].rank : i + 1 });
  }
  return ranked;
}

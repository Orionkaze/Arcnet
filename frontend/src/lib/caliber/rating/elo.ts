export function expectedScore(rating: number, difficulty: number): number {
  return 1 / (1 + Math.pow(10, (difficulty - rating) / 400));
}

export function updateRating(rating: number, difficulty: number, outcome: number, k = 32): number {
  const clamped = Math.max(0, Math.min(1, outcome));
  return rating + k * (clamped - expectedScore(rating, difficulty));
}

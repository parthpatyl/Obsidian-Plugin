/**
 * Simplified SM-2 inspired spaced repetition algorithm
 * Increases interval with each attempt
 */
export function computeNextReview(attempts: number, intervalDays: number): string {
  const multiplier = Math.min(attempts, 5);
  const days = intervalDays * multiplier;
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString().split("T")[0];
}

/**
 * Check if a note is due for review
 */
export function isDueForReview(nextReviewDate: string): boolean {
  if (!nextReviewDate) return false;
  const today = new Date().toISOString().split("T")[0];
  return nextReviewDate <= today;
}

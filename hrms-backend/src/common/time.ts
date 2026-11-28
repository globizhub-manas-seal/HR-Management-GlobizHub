/**
 * Calendar-accurate month arithmetic (Jan 31 + 1 month = Feb 28/29, not Mar 3).
 */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Clamp when the target month has fewer days (e.g. Jan 31 -> Feb 31 -> Feb 28)
  if (d.getDate() < day) d.setDate(0);
  return d;
}

/**
 * Fraction of `termDays` remaining between now and `endsAt` (0..1).
 */
export function remainingFraction(now: Date, endsAt: Date, termDays: number): number {
  const ms = endsAt.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.min(1, ms / (termDays * 86400000));
}

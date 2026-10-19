/**
 * Add calendar days to a YYYY-MM-DD date without interpreting that date as UTC.
 * Using local noon avoids the midnight UTC shift that can move planner tasks
 * to a different day in the user's timezone.
 */
export function addDaysToDateOnly(dateOnly: string | undefined, days: number, now = new Date()): string {
  const date = dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(dateOnly)
    ? new Date(`${dateOnly}T12:00:00`)
    : new Date(now);

  if (!Number.isFinite(date.getTime())) {
    throw new RangeError('Data inválida para reagendamento.');
  }

  date.setDate(date.getDate() + Math.trunc(Number.isFinite(days) ? days : 0));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

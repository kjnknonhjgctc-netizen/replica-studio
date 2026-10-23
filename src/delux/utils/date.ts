/**
 * Add calendar days to a YYYY-MM-DD date without interpreting that date as UTC.
 * Using local noon avoids the midnight UTC shift that can move planner tasks
 * to a different day in the user's timezone.
 */
export function addDaysToDateOnly(
  dateOnly: string | undefined,
  days: number,
  now = new Date(),
): string {
  const date =
    dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(dateOnly)
      ? new Date(dateOnly + "T12:00:00")
      : new Date(now);

  if (!Number.isFinite(date.getTime())) {
    throw new RangeError("Data inválida para reagendamento.");
  }

  date.setDate(date.getDate() + Math.trunc(Number.isFinite(days) ? days : 0));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}


const WEEKDAY_KEYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const;

/** Format a Date using the user's local calendar date, never UTC. */
export function formatLocalDate(date: Date): string {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

/**
 * Return the Nth preferred calendar day on or after startDate.
 * offset=0 means the first matching day; offset=1 means the next matching day.
 */
export function getNextPreferredDate(
  preferredDays: string[],
  offset = 0,
  startDate = new Date(),
): string {
  const normalized = new Set(preferredDays.filter((day) => WEEKDAY_KEYS.includes(day as typeof WEEKDAY_KEYS[number])));
  const allowed = normalized.size ? normalized : new Set(['seg', 'ter', 'qua', 'qui', 'sex']);
  const target = Math.max(0, Math.min(370, Math.floor(Number.isFinite(offset) ? offset : 0)));
  const date = new Date(startDate);
  date.setHours(12, 0, 0, 0);
  let matched = -1;

  for (let i = 0; i < 371; i++) {
    const weekday = WEEKDAY_KEYS[date.getDay()];
    if (weekday && allowed.has(weekday)) {
      matched++;
      if (matched === target) return formatLocalDate(date);
    }
    date.setDate(date.getDate() + 1);
  }

  throw new Error('Não foi possível encontrar um dia disponível no calendário.');
}

export function isPreferredDate(dateOnly: string, preferredDays: string[]): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return false;
  const date = new Date(dateOnly + 'T12:00:00');
  if (!Number.isFinite(date.getTime()) || formatLocalDate(date) !== dateOnly) return false;
  const allowed = new Set(preferredDays.filter((day) => WEEKDAY_KEYS.includes(day as typeof WEEKDAY_KEYS[number])));
  const weekday = WEEKDAY_KEYS[date.getDay()];
  if (!weekday) return false;
  if (!allowed.size) return ['seg', 'ter', 'qua', 'qui', 'sex'].includes(weekday);
  return allowed.has(weekday);
}

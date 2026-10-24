import { addDaysToDateOnly, formatLocalDate, isPreferredDate } from './date';

export const OPEN_STATUSES = ['pending', 'in_progress', 'postponed'];

type MissionLike = { id?: string; scheduled_date?: string | null; status?: string; estimated_minutes?: number | string | null };

/** Minutes of unfinished work already booked per date, optionally ignoring one mission. */
export function plannedLoad(missions: MissionLike[], excludeId?: string): Record<string, number> {
  const load: Record<string, number> = {};
  for (const m of missions) {
    if (!m.scheduled_date || m.id === excludeId || !OPEN_STATUSES.includes(String(m.status))) continue;
    load[m.scheduled_date] = (load[m.scheduled_date] || 0) + (Number(m.estimated_minutes) || 0);
  }
  return load;
}

/**
 * First allowed date on or after `start` (never before `today`) where the task fits
 * within the daily capacity. Returns null when nothing fits within a year.
 * A task longer than the whole capacity may take an otherwise empty allowed day.
 */
export function findAvailableDate(opts: {
  start: string; minutes: number; allowedDays: string[]; load: Record<string, number>; capacity: number; today?: string;
}): string | null {
  const today = opts.today || formatLocalDate(new Date());
  let date = opts.start && /^\d{4}-\d{2}-\d{2}$/.test(opts.start) && opts.start >= today ? opts.start : today;
  const minutes = Math.max(0, Number(opts.minutes) || 0);
  for (let i = 0; i < 371; i++) {
    if (isPreferredDate(date, opts.allowedDays)) {
      const used = opts.load[date] || 0;
      if (used + minutes <= opts.capacity || (used === 0 && minutes > opts.capacity)) return date;
    }
    date = addDaysToDateOnly(date, 1);
  }
  return null;
}

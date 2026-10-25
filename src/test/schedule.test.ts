import { describe, it, expect } from 'vitest';
import { findAvailableDate, plannedLoad } from '@/delux/utils/schedule';
// 2026-10-24 is a Saturday
describe('findAvailableDate', () => {
  it('skips unavailable days', () => {
    expect(findAvailableDate({ start: '2026-10-24', minutes: 20, allowedDays: ['seg'], load: {}, capacity: 30, today: '2026-10-24' })).toBe('2026-10-26');
  });
  it('respects daily minute limit', () => {
    const load = plannedLoad([{ id: 'a', scheduled_date: '2026-10-26', status: 'pending', estimated_minutes: 20 }]);
    expect(findAvailableDate({ start: '2026-10-26', minutes: 20, allowedDays: ['seg', 'ter'], load, capacity: 30, today: '2026-10-24' })).toBe('2026-10-27');
  });
  it('never schedules in the past', () => {
    expect(findAvailableDate({ start: '2026-10-01', minutes: 10, allowedDays: ['seg'], load: {}, capacity: 30, today: '2026-10-24' })).toBe('2026-10-26');
  });
  it('ignores the mission being rescheduled', () => {
    expect(plannedLoad([{ id: 'a', scheduled_date: '2026-10-26', status: 'pending', estimated_minutes: 30 }], 'a')).toEqual({});
  });
});

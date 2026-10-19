import { describe, expect, it } from 'vitest';
import { addDaysToDateOnly } from '../delux/utils/date';

describe('addDaysToDateOnly', () => {
  it('moves a date-only value by calendar days without UTC conversion', () => {
    expect(addDaysToDateOnly('2026-10-18', 1)).toBe('2026-10-19');
    expect(addDaysToDateOnly('2026-10-18', -1)).toBe('2026-10-17');
  });

  it('handles month and year boundaries', () => {
    expect(addDaysToDateOnly('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysToDateOnly('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('uses the supplied current date when no date is set', () => {
    expect(addDaysToDateOnly(undefined, 1, new Date('2026-10-18T12:00:00'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

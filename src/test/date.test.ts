import { describe, expect, it } from "vitest";
import { addDaysToDateOnly } from "../delux/utils/date";

describe("addDaysToDateOnly", () => {
  it("moves a date-only value by calendar days without UTC conversion", () => {
    expect(addDaysToDateOnly("2026-10-18", 1)).toBe("2026-10-19");
    expect(addDaysToDateOnly("2026-10-18", -1)).toBe("2026-10-17");
  });

  it("handles month and year boundaries", () => {
    expect(addDaysToDateOnly("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDaysToDateOnly("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("uses the supplied current date when no date is set", () => {
    expect(addDaysToDateOnly(undefined, 1, new Date("2026-10-18T12:00:00"))).toBe("2026-10-19");
  });
});


import { formatLocalDate, getNextPreferredDate, isPreferredDate } from "../delux/utils/date";

describe("preferred-day scheduling", () => {
  it("uses the first matching day as offset zero and counts matching days, not calendar days", () => {
    expect(getNextPreferredDate(["seg", "qua"], 0, new Date("2026-10-19T12:00:00"))).toBe("2026-10-19");
    expect(getNextPreferredDate(["seg", "qua"], 1, new Date("2026-10-19T12:00:00"))).toBe("2026-10-21");
  });

  it("moves a disallowed date to the next preferred day", () => {
    expect(getNextPreferredDate(["seg", "ter", "qua", "qui"], 0, new Date("2026-10-23T12:00:00"))).toBe("2026-10-26");
    expect(isPreferredDate("2026-10-23", ["seg", "ter", "qua", "qui"])).toBe(false);
    expect(isPreferredDate("2026-10-22", ["seg", "ter", "qua", "qui"])).toBe(true);
  });

  it("formats calendar dates in local time instead of converting to UTC", () => {
    const date = new Date(2026, 9, 22, 23, 30);
    expect(formatLocalDate(date)).toBe("2026-10-22");
  });

  it("falls back to weekdays when the preference list is empty or invalid", () => {
    expect(getNextPreferredDate([], 0, new Date("2026-10-24T12:00:00"))).toBe("2026-10-26");
  });
});

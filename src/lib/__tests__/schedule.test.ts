import { describe, expect, it } from "vitest";
import { nextPickup, timeWindowIsPast, type ScheduleEntry } from "../schedule";

const make = (
  dayOfWeek: number,
  binType: ScheduleEntry["binType"] = "TRASH",
  action: ScheduleEntry["action"] = "PULL_OUT",
  timeWindow: string | null = null,
): ScheduleEntry => ({
  id: `${dayOfWeek}-${binType}-${action}`,
  dayOfWeek,
  binType,
  action,
  timeWindow,
});

describe("nextPickup", () => {
  it("returns null when schedule is empty", () => {
    expect(nextPickup([])).toBeNull();
  });

  it("returns today when there's a future-window entry today", () => {
    // Wednesday 10am
    const now = new Date("2026-04-29T10:00:00");
    const result = nextPickup([make(3, "TRASH", "PULL_OUT", "8pm - 11pm")], now);
    expect(result?.daysAhead).toBe(0);
    expect(result?.dayLabel).toBe("Today");
  });

  it("skips today if all windows have passed", () => {
    // Wednesday 10pm
    const now = new Date("2026-04-29T22:00:00");
    const result = nextPickup(
      [
        make(3, "TRASH", "PULL_OUT", "8am - 11am"), // already past
        make(4, "RECYCLING", "PULL_OUT", "8pm - 11pm"),
      ],
      now,
    );
    expect(result?.daysAhead).toBe(1);
    expect(result?.dayLabel).toBe("Tomorrow");
  });

  it("wraps around the week", () => {
    // Saturday 9am — only Monday entries
    const now = new Date("2026-04-25T09:00:00"); // Saturday
    const result = nextPickup([make(1, "TRASH", "PULL_OUT")], now);
    expect(result?.daysAhead).toBe(2); // Sat -> Mon
    expect(result?.dayLabel).toBe("Monday");
  });
});

describe("timeWindowIsPast", () => {
  it("returns false when window is null", () => {
    expect(timeWindowIsPast(null, new Date())).toBe(false);
  });

  it("returns true when end time has passed", () => {
    expect(timeWindowIsPast("8am - 11am", new Date("2026-04-29T13:00:00"))).toBe(true);
  });

  it("returns false when end time is in the future", () => {
    expect(timeWindowIsPast("8pm - 11pm", new Date("2026-04-29T13:00:00"))).toBe(
      false,
    );
  });

  it("returns false on unparseable input (defensive)", () => {
    expect(timeWindowIsPast("morning", new Date("2026-04-29T13:00:00"))).toBe(false);
  });
});

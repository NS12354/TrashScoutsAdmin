import { DAY_NAMES } from "./format";

export type ScheduleEntry = {
  id: string;
  dayOfWeek: number;
  binType: string;
  action: string;
  timeWindow: string | null;
};

export type NextPickupGroup = {
  daysAhead: number; // 0 = today, 1 = tomorrow, ...
  dayLabel: string; // "Today" | "Tomorrow" | "Friday"
  date: Date;
  items: ScheduleEntry[];
};

// Returns the next day-of-week (within a week) that has any schedule entries.
// "Today" only counts if at least one of today's entries hasn't passed yet.
export function nextPickup(
  schedule: ScheduleEntry[],
  now: Date = new Date(),
): NextPickupGroup | null {
  if (schedule.length === 0) return null;

  const today = now.getDay();

  for (let offset = 0; offset < 7; offset++) {
    const day = (today + offset) % 7;
    const items = schedule.filter((s) => s.dayOfWeek === day);
    if (items.length === 0) continue;

    if (offset === 0) {
      const stillUpcoming = items.filter(
        (it) => !timeWindowIsPast(it.timeWindow, now),
      );
      if (stillUpcoming.length === 0) continue;
      return {
        daysAhead: 0,
        dayLabel: "Today",
        date: now,
        items: stillUpcoming,
      };
    }

    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    return {
      daysAhead: offset,
      dayLabel: offset === 1 ? "Tomorrow" : DAY_NAMES[day] ?? "",
      date,
      items,
    };
  }
  return null;
}

// Best-effort parse of a time window like "6pm - 9pm" or "8am - 11am".
// Returns true if the END of the window has already passed today.
// If the window can't be parsed, returns false (don't filter it out).
export function timeWindowIsPast(window: string | null, now: Date): boolean {
  if (!window) return false;
  const m = window.match(
    /([0-9]{1,2})(?::([0-9]{2}))?\s*(am|pm)?\s*[-–to]+\s*([0-9]{1,2})(?::([0-9]{2}))?\s*(am|pm)?/i,
  );
  if (!m) return false;

  const endHourStr = m[4];
  if (!endHourStr) return false;
  const endHourRaw = parseInt(endHourStr, 10);
  const endMin = m[5] ? parseInt(m[5], 10) : 0;
  const endAmPm = (m[6] ?? m[3] ?? "").toLowerCase();

  let endHour = endHourRaw;
  if (endAmPm === "pm" && endHour < 12) endHour += 12;
  if (endAmPm === "am" && endHour === 12) endHour = 0;

  const end = new Date(now);
  end.setHours(endHour, endMin, 0, 0);
  return now > end;
}

// Shared helpers for the Diversion Report builder. Lives in lib/ so
// both the page (server) and the builder (client) can use the same
// stream mapping without duplicating the constants.

// Map Service Schedule bin types onto the report's waste streams.
// OTHER is treated as Landfill — closer to reality than dropping it,
// and the admin can edit the prefilled row before generating.
export const STREAM_FROM_BIN_TYPE: Record<string, string> = {
  TRASH: "Landfill",
  RECYCLING: "Mixed Recycling",
  ORGANICS: "Organics",
  FIBER: "Cardboard / Fiber",
  BOTTLES_CANS: "Bottles / Cans / Plastics",
  OTHER: "Landfill",
};

export type ScheduleRowForReport = {
  binType: string;
  action: string;
  binCount: number | null;
  binSize: number | null;
};

export type AutofillRow = {
  stream: string;
  bins: number;
  sizeVal: number;
  pickups: number;
};

// Convert a property's Service Schedule into prefilled waste-stream
// rows for the Diversion Report's volume mode. Groups by (stream, size)
// so a property with 3-cu-yd trash on Tue + 3-cu-yd trash on Fri shows
// up as a single row with pickups=2.
//
// Skips RETURN actions (they're not separate pickups) and skips any
// row missing binCount or binSize — those properties just see the
// default starter rows until an admin fills the schedule in.
export function autofillFromSchedule(
  schedule: ScheduleRowForReport[],
): AutofillRow[] {
  const groups = new Map<
    string,
    { stream: string; sizeVal: number; pickups: number; maxBins: number }
  >();
  for (const s of schedule) {
    if (s.action !== "PULL_OUT" && s.action !== "SERVICE_DAY") continue;
    if (s.binCount == null || s.binSize == null) continue;
    const stream = STREAM_FROM_BIN_TYPE[s.binType];
    if (!stream) continue;
    const key = `${stream}|${s.binSize}`;
    const existing = groups.get(key);
    if (existing) {
      existing.pickups += 1;
      if (s.binCount > existing.maxBins) existing.maxBins = s.binCount;
    } else {
      groups.set(key, {
        stream,
        sizeVal: s.binSize,
        pickups: 1,
        maxBins: s.binCount,
      });
    }
  }
  return [...groups.values()].map((g) => ({
    stream: g.stream,
    bins: g.maxBins,
    sizeVal: g.sizeVal,
    pickups: g.pickups,
  }));
}

// Helpers for auto-populating the Pricing tool from a property's
// Service Schedule. Lives in lib/ so both the page (server) and the
// PricingTool (client) can use the same mapping without duplicating
// constants.
//
// Stream choices match the dropdown values in components/admin/PricingTool.tsx.

export const STREAM_FROM_BIN_TYPE: Record<
  string,
  { stream: string; customName: string }
> = {
  TRASH: { stream: "Landfill", customName: "" },
  RECYCLING: { stream: "Recycling", customName: "" },
  ORGANICS: { stream: "Organics", customName: "" },
  FIBER: { stream: "__other__", customName: "Fiber / Cardboard" },
  BOTTLES_CANS: { stream: "Bottles/Cans", customName: "" },
  OTHER: { stream: "__other__", customName: "Other" },
};

export type ScheduleRowForPricing = {
  binType: string;
  action: string;
  binCount: number | null;
  binSize: number | null;
  dayOfWeek: number;
};

export type PricingAutofillStream = {
  stream: string;
  customName: string;
  carts: number;
  dumpsters: number;
  days: number[];
  // "both" when any row in the group is a PULL_OUT / RETURN, "cycle"
  // when every row in the group is a SERVICE_DAY. "both" is the safer
  // default — most properties have a push-back the same week.
  mode: "both" | "cycle";
};

// Threshold between "cart" and "dumpster" in cubic yards. A 96 gal
// cart is ~0.475 cu yd, so anything below ~0.7 is treated as a cart.
const DUMPSTER_THRESHOLD_CUYD = 0.7;

// Build a starter set of streams for the Pricing tool from a property's
// schedule. We group by binType so a property with trash on Tue + Fri
// produces a single stream with both days selected, not two streams.
//
// Rows missing binSize get bucketed by their (more common) bin width:
// we assume dumpster unless binCount is large enough to obviously be
// carts. Admin can always edit afterwards.
export function autofillStreamsFromSchedule(
  schedule: ScheduleRowForPricing[],
): PricingAutofillStream[] {
  const groups = new Map<
    string,
    {
      stream: string;
      customName: string;
      carts: number;
      dumpsters: number;
      days: Set<number>;
      anyMove: boolean;
      anyCycle: boolean;
    }
  >();

  for (const row of schedule) {
    // RETURN rows are the bring-back leg of a pull-out pair; the
    // pricing tool already models that under "Pull + push" so we
    // don't need to count the day twice.
    if (row.action !== "PULL_OUT" && row.action !== "SERVICE_DAY") continue;
    const map = STREAM_FROM_BIN_TYPE[row.binType];
    if (!map) continue;

    const key = `${row.binType}|${map.stream}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        stream: map.stream,
        customName: map.customName,
        carts: 0,
        dumpsters: 0,
        days: new Set(),
        anyMove: false,
        anyCycle: false,
      };
      groups.set(key, g);
    }

    g.days.add(row.dayOfWeek);
    if (row.action === "PULL_OUT") g.anyMove = true;
    if (row.action === "SERVICE_DAY") g.anyCycle = true;

    const count = row.binCount && row.binCount > 0 ? row.binCount : 1;
    if (row.binSize != null && row.binSize >= DUMPSTER_THRESHOLD_CUYD) {
      g.dumpsters = Math.max(g.dumpsters, count);
    } else if (row.binSize != null) {
      g.carts = Math.max(g.carts, count);
    } else {
      // No size on file — default to carts, which is the safer guess
      // for most multifamily properties.
      g.carts = Math.max(g.carts, count);
    }
  }

  return [...groups.values()].map((g) => ({
    stream: g.stream,
    customName: g.customName,
    carts: g.carts,
    dumpsters: g.dumpsters,
    days: [...g.days].sort((a, b) => a - b),
    mode: g.anyMove || !g.anyCycle ? "both" : "cycle",
  }));
}

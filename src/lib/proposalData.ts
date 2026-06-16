// Shape of the JSON payload we store on Proposal.data. Identical to the
// serialized PricingTool state — using the same envelope means the
// public proposal page can render the exact same proposal the admin
// previewed.

export type ProposalStream = {
  id: number;
  stream: string;
  customName: string;
  carts: number;
  dumpsters: number;
  sowMin: number;
  sowScope: string;
  dumpIsCompactor: boolean;
  dist: "d1" | "d2" | "d3";
  split: boolean;
  cartDist: "d1" | "d2" | "d3";
  dumpDist: "d1" | "d2" | "d3";
  mode: "both" | "pull" | "cycle" | "sow";
  days: number[];
  splitSched: boolean;
  cartDays: number[];
  dumpDays: number[];
  pull: number;
  push: number;
  stairs: "none" | "short" | "long";
  elev: boolean;
  elevTrips: number;
  truck: boolean;
  truckBins: number;
};

export type ProposalData = {
  v: 1;
  streams: ProposalStream[];
  drive: number;
  cleanup: number;
  wage: number;
  overhead: number;
  minPrice: number;
  margin: number;
};

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function streamName(s: ProposalStream): string {
  if (s.stream === "__other__") return s.customName.trim() || "Other";
  return s.stream || "Waste stream";
}

export function binText(s: ProposalStream): string {
  if (s.mode === "sow") return `${s.sowMin} min on site`;
  const parts: string[] = [];
  if (s.dumpsters) {
    const label =
      s.dumpIsCompactor && s.mode !== "cycle"
        ? "compactor dumpster"
        : "dumpster";
    parts.push(`${s.dumpsters} ${label}${s.dumpsters > 1 ? "s" : ""}`);
  }
  if (s.carts) parts.push(`${s.carts} cart${s.carts > 1 ? "s" : ""}`);
  return parts.join(", ");
}

export function formatDays(days: number[], full = false): string {
  const sorted = [...days].sort((a, b) => a - b);
  const names = full ? DAYS_LONG.map((d) => `${d}s`) : DAYS_SHORT;
  const labels = sorted.map((d) => names[d]);
  if (!full) return labels.join(", ");
  if (labels.length <= 1) return labels[0] || "";
  return labels.slice(0, -1).join(", ") + " & " + labels[labels.length - 1];
}

export function scheduleText(s: ProposalStream): string {
  if (s.mode !== "sow" && s.splitSched) {
    const pp: string[] = [];
    if (s.carts > 0 && s.cartDays.length)
      pp.push(`Carts: ${formatDays(s.cartDays, true)}`);
    if (s.dumpsters > 0 && s.dumpDays.length)
      pp.push(`Dumpsters: ${formatDays(s.dumpDays, true)}`);
    return pp.join(" · ");
  }
  return formatDays(s.days, true);
}

// Filter to streams that have a real, scheduled service line — same
// rule the calculator uses, so what the client sees matches the price.
export function activeStreams(data: ProposalData): ProposalStream[] {
  return data.streams.filter((s) => {
    if (s.mode === "sow") return s.sowMin > 0 && s.days.length > 0;
    const cdays = s.splitSched ? s.cartDays : s.days;
    const ddays = s.splitSched ? s.dumpDays : s.days;
    return (
      (s.carts > 0 && cdays.length > 0) ||
      (s.dumpsters > 0 && ddays.length > 0)
    );
  });
}

export function presentModes(data: ProposalData): Array<"both" | "pull" | "cycle" | "sow"> {
  const order: Array<"both" | "pull" | "cycle" | "sow"> = [
    "both",
    "pull",
    "cycle",
    "sow",
  ];
  const a = activeStreams(data);
  return order.filter((m) => a.some((s) => s.mode === m));
}

export function hasHaulerMode(data: ProposalData): boolean {
  return presentModes(data).some((m) => m !== "sow");
}

export function usd(n: number, cents = false): string {
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0,
    })
  );
}

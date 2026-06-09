export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const BIN_LABEL: Record<string, string> = {
  TRASH: "Landfill",
  RECYCLING: "Recycling",
  ORGANICS: "Organics",
  FIBER: "Fiber / Cardboard",
  BOTTLES_CANS: "Bottles and Cans",
  OTHER: "Other",
};

export const BIN_COLOR: Record<string, string> = {
  TRASH: "bg-zinc-800 text-white",
  RECYCLING: "bg-blue-600 text-white",
  ORGANICS: "bg-green-700 text-white",
  FIBER: "bg-amber-800 text-white",
  BOTTLES_CANS: "bg-sky-600 text-white",
  OTHER: "bg-amber-600 text-white",
};

export const ACTION_LABEL: Record<string, string> = {
  PULL_OUT: "Put out",
  RETURN: "Bring in",
  SERVICE_DAY: "Service day",
};

// Bin sizes (cubic yards per pickup) the admin can pick from when
// building a property's Service Schedule. The cu yd value feeds the
// Diversion Report's volume math. Cart sizes are converted from
// gallons at the standard waste-industry rate of 202 gal/cu yd.
export const BIN_SIZE_OPTIONS: Array<{ label: string; cuyd: number }> = [
  { label: "20 Gallon Cart", cuyd: 20 / 202 },
  { label: "32 Gallon Cart", cuyd: 32 / 202 },
  { label: "35 Gallon Cart", cuyd: 35 / 202 },
  { label: "64 Gallon Cart", cuyd: 64 / 202 },
  { label: "96 Gallon Cart", cuyd: 96 / 202 },
  { label: "1 Cubic Yard", cuyd: 1 },
  { label: "1.5 Cubic Yard", cuyd: 1.5 },
  { label: "2 Cubic Yard", cuyd: 2 },
  { label: "3 Cubic Yard", cuyd: 3 },
  { label: "4 Cubic Yard", cuyd: 4 },
  { label: "6 Cubic Yard", cuyd: 6 },
  { label: "7 Cubic Yard", cuyd: 7 },
  { label: "8 Cubic Yard", cuyd: 8 },
];

export function binSizeLabel(cuyd: number | null | undefined) {
  if (cuyd == null) return null;
  return (
    BIN_SIZE_OPTIONS.find((s) => Math.abs(s.cuyd - cuyd) < 0.0001)?.label ?? null
  );
}

// Short size string for use inside a bin badge — "2 Yard" or "96 Gal".
// Falls back to a generic "X cu yd" if we don't recognize the size as a
// standard cart or dumpster.
function shortBinSize(cuyd: number): { sizeText: string; suffix: string } {
  if (cuyd >= 1) {
    const num = cuyd % 1 === 0 ? String(cuyd) : cuyd.toFixed(1);
    return { sizeText: `${num} Yard`, suffix: "Dumpster" };
  }
  return { sizeText: `${Math.round(cuyd * 202)} Gal`, suffix: "Cart" };
}

// Format a service-schedule bin badge for the resident page.
//   "(2) 2 Yard Recycling Dumpster"
//   "1 Yard Landfill Dumpster" (count omitted when 1)
//   "96 Gal Organics Cart"
// Falls back to "Recycling × 2" when size isn't set so we don't lie
// about contracted bin specs we don't have on file.
export function formatBinBadge(
  binType: string,
  binCount: number | null | undefined,
  binSize: number | null | undefined,
): string {
  const label = BIN_LABEL[binType] ?? binType;
  if (binSize == null) {
    if (binCount && binCount > 1) return `${label} × ${binCount}`;
    return label;
  }
  const { sizeText, suffix } = shortBinSize(binSize);
  const countPrefix = binCount && binCount > 1 ? `(${binCount}) ` : "";
  return `${countPrefix}${sizeText} ${label} ${suffix}`;
}

// Counties we have agency recycling info for. The value is what's stored
// on Property.county; the label is shown in the admin dropdown. Adding a
// new county is two lines here + one entry in COUNTY_AGENCY below.
export const COUNTY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALAMEDA", label: "Alameda County" },
  { value: "CONTRA_COSTA", label: "Contra Costa County" },
  { value: "SAN_FRANCISCO", label: "San Francisco County" },
  { value: "SAN_MATEO", label: "San Mateo County" },
];

// Authoritative local recycling/sorting info, published by the public
// agency for each county. Shown as a link card on /p/[id]/guide so
// residents always have the official source for their address.
export const COUNTY_AGENCY: Record<
  string,
  { name: string; url: string }
> = {
  ALAMEDA: {
    name: "StopWaste (Alameda County)",
    url: "https://resource.stopwaste.org/curbside",
  },
  CONTRA_COSTA: {
    name: "StopWaste (Contra Costa County)",
    url: "https://resource.stopwaste.org/curbside",
  },
  SAN_FRANCISCO: {
    name: "SF Environment",
    url: "https://www.sfenvironment.org/sfrecycles",
  },
  SAN_MATEO: {
    name: "RecycleStuff (San Mateo County)",
    url: "https://recyclestuff.org/",
  },
};

export function countyLabel(value: string | null | undefined) {
  if (!value) return null;
  return COUNTY_OPTIONS.find((c) => c.value === value)?.label ?? value;
}

export const ISSUE_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "BROKEN_BIN", label: "Broken Bin" },
  { value: "BULKY_ITEM", label: "Bulky Item" },
  { value: "OVERFLOW", label: "Overflow / Overflowing Bins" },
  { value: "MISSING_BINS", label: "Missing Bins" },
  { value: "CONTAMINATION", label: "Contamination" },
  { value: "HAZARDOUS_WASTE_IN_BINS", label: "Hazardous Waste inside bins" },
  { value: "OTHER", label: "Other" },
];

export function issueCategoryLabel(value: string) {
  return ISSUE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function renderGuide(content: string) {
  // Tiny "## heading" + paragraph renderer — no external markdown lib for MVP.
  const blocks: Array<{ type: "h" | "p" | "ul"; text?: string; items?: string[] }> = [];
  const lines = content.split("\n");
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join(" ") });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "ul", items: list });
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushPara();
      flushList();
      blocks.push({ type: "h", text: line.slice(3) });
      continue;
    }
    if (line.startsWith("- ")) {
      flushPara();
      list.push(line.slice(2));
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();

  return blocks;
}

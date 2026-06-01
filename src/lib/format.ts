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
  TRASH: "Trash",
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

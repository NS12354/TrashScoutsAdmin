// County-specific "What Goes Where" content for the resident guide.
// Items are emoji-keyed so they render visually without hotlinking
// agency assets (copyright + flaky load times). Rules are based on the
// public guides each agency publishes — keep updated when those change.

export type GuideItem = {
  emoji: string;
  name: string;
};

export type GuideMaterial = {
  // Bin key matches BIN_LABEL / BIN_COLOR in lib/format.ts so the
  // resident page can paint each card with the same color used in the
  // Service Schedule badges.
  bin: "TRASH" | "RECYCLING" | "ORGANICS" | "FIBER" | "BOTTLES_CANS";
  headerEmoji: string;
  summary: string;
  yes: GuideItem[];
  no: GuideItem[];
};

export type CountyGuide = {
  materials: GuideMaterial[];
  tips: string[];
};

// ─── Shared starter content ──────────────────────────────────────────
// Most Bay Area counties share the same core sorting rules; we capture
// those here once and let each county override or extend.
const SHARED_LANDFILL: GuideMaterial = {
  bin: "TRASH",
  headerEmoji: "🗑️",
  summary: "Only things that can't be composted or recycled.",
  yes: [
    { emoji: "🍼", name: "Diapers" },
    { emoji: "💩", name: "Pet waste (bagged)" },
    { emoji: "🧴", name: "Empty toothpaste tubes" },
    { emoji: "🪥", name: "Toothbrushes" },
    { emoji: "🍫", name: "Foil-lined wrappers" },
    { emoji: "🧹", name: "Broken dishes / ceramics" },
  ],
  no: [
    { emoji: "🥬", name: "Food scraps → Organics" },
    { emoji: "📦", name: "Cardboard → Recycling" },
    { emoji: "🥫", name: "Cans → Recycling" },
    { emoji: "🔋", name: "Batteries → HHW drop-off" },
  ],
};

const SHARED_ORGANICS: GuideMaterial = {
  bin: "ORGANICS",
  headerEmoji: "🥦",
  summary: "Food, food-soiled paper, and plant trimmings.",
  yes: [
    { emoji: "🍎", name: "Fruit & vegetable scraps" },
    { emoji: "🦴", name: "Meat & bones" },
    { emoji: "🥚", name: "Eggshells" },
    { emoji: "☕", name: "Coffee grounds & filters" },
    { emoji: "🧻", name: "Used napkins & paper towels" },
    { emoji: "🌿", name: "Plant trimmings & leaves" },
    { emoji: "🍞", name: "Bread, grains, leftovers" },
  ],
  no: [
    { emoji: "🛍️", name: "Plastic bags (even compostable)" },
    { emoji: "💩", name: "Pet waste" },
    { emoji: "🍼", name: "Diapers" },
    { emoji: "🪵", name: "Treated or painted wood" },
  ],
};

const SHARED_RECYCLING: GuideMaterial = {
  bin: "RECYCLING",
  headerEmoji: "♻️",
  summary: "Clean, dry, and empty — rinse before tossing.",
  yes: [
    { emoji: "🥫", name: "Metal cans (steel, aluminum)" },
    { emoji: "🍾", name: "Glass bottles & jars" },
    { emoji: "🥤", name: "Rigid plastics #1, #2, #5" },
    { emoji: "📄", name: "Clean paper & magazines" },
    { emoji: "📦", name: "Flattened cardboard" },
    { emoji: "📰", name: "Newspaper" },
  ],
  no: [
    { emoji: "🛍️", name: "Plastic bags & film" },
    { emoji: "🧊", name: "Styrofoam" },
    { emoji: "🍕", name: "Food-soiled paper" },
    { emoji: "💧", name: "Wet or shredded paper" },
  ],
};

const SHARED_TIPS = [
  "When in doubt, throw it out — contamination ruins whole loads.",
  "Empty and rinse containers before recycling.",
  "Break down cardboard so it fits flat in the bin.",
  "Bag pet waste before placing in landfill — never in organics.",
];

// ─── Per-county guides ───────────────────────────────────────────────
// Counties share the core Bay-Area sorting rules. Differences (e.g.
// SF's separate composting expectations, or stricter Fiber sorting in
// some commercial programs) live in overrides below.

const ALAMEDA: CountyGuide = {
  materials: [
    SHARED_LANDFILL,
    SHARED_RECYCLING,
    SHARED_ORGANICS,
  ],
  tips: [
    ...SHARED_TIPS,
    "StopWaste curbside guide is the source of truth — link above.",
  ],
};

const CONTRA_COSTA: CountyGuide = {
  materials: [
    SHARED_LANDFILL,
    SHARED_RECYCLING,
    SHARED_ORGANICS,
  ],
  tips: [
    ...SHARED_TIPS,
    "Contra Costa shares StopWaste's curbside rules with Alameda — link above.",
  ],
};

const SAN_FRANCISCO: CountyGuide = {
  materials: [
    {
      ...SHARED_LANDFILL,
      summary:
        "Black bin — only things that can't be composted or recycled. SF has the strictest sorting in the Bay Area.",
    },
    SHARED_RECYCLING,
    {
      ...SHARED_ORGANICS,
      summary:
        "Green bin — food and food-soiled paper. SF residents are expected to compost ALL food scraps.",
    },
  ],
  tips: [
    ...SHARED_TIPS,
    "SF Environment publishes a searchable item-by-item guide — link above.",
  ],
};

const SAN_MATEO: CountyGuide = {
  materials: [
    SHARED_LANDFILL,
    SHARED_RECYCLING,
    SHARED_ORGANICS,
  ],
  tips: [
    ...SHARED_TIPS,
    "RecycleStuff.org has a searchable A–Z item lookup — link above.",
  ],
};

const DEFAULT_GUIDE: CountyGuide = {
  materials: [SHARED_LANDFILL, SHARED_RECYCLING, SHARED_ORGANICS],
  tips: SHARED_TIPS,
};

export function guideForCounty(
  county: string | null | undefined,
): CountyGuide {
  if (!county) return DEFAULT_GUIDE;
  switch (county) {
    case "ALAMEDA":
      return ALAMEDA;
    case "CONTRA_COSTA":
      return CONTRA_COSTA;
    case "SAN_FRANCISCO":
      return SAN_FRANCISCO;
    case "SAN_MATEO":
      return SAN_MATEO;
    default:
      return DEFAULT_GUIDE;
  }
}

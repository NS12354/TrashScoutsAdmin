// County-specific "What Goes Where" content for the resident guide.
// Modeled on the layout of resource.stopwaste.org/curbside — a tab per
// bin, with item lists that include prep instructions ("Empty and
// drip-free," "Flatten," etc.). Items use emoji icons so they render
// universally without hotlinking agency assets.

export type GuideItem = {
  emoji: string;
  name: string;
  note?: string; // short preparation instruction
};

export type GuideMaterial = {
  // Bin key matches BIN_LABEL / BIN_COLOR in lib/format.ts.
  // SPECIAL is a synthetic bin for items that need their own
  // collection method (batteries, motor oil, Christmas trees, etc.).
  bin: "TRASH" | "RECYCLING" | "ORGANICS" | "SPECIAL";
  tabLabel: string; // short label for the tab strip
  headerEmoji: string;
  summary: string;
  yes: GuideItem[];
  no: GuideItem[];
};

export type CountyGuide = {
  materials: GuideMaterial[];
  tips: string[];
};

/* ─── Shared base content ───────────────────────────────────────────
 * Bay Area counties share most of the same curbside rules; we capture
 * the StopWaste curbside ruleset (which covers Alameda + Contra Costa)
 * here once and let each county override or extend below.
 */

const RECYCLING: GuideMaterial = {
  bin: "RECYCLING",
  tabLabel: "Recycling",
  headerEmoji: "♻️",
  summary: "Blue bin — clean, dry, and empty.",
  yes: [
    { emoji: "📦", name: "Cardboard", note: "Flatten" },
    { emoji: "📄", name: "Mixed paper", note: "Junk mail, office paper" },
    { emoji: "📰", name: "Newspaper & magazines" },
    { emoji: "🥫", name: "Metal cans", note: "Rinse — steel, tin, aluminum" },
    { emoji: "🍾", name: "Glass bottles & jars", note: "Rinse, keep caps on" },
    { emoji: "🥤", name: "Plastic bottles", note: "Caps on (CRV redeemable)" },
    { emoji: "🧴", name: "Plastic jugs & tubs", note: "Milk, detergent, yogurt — #1, #2, #5" },
    { emoji: "🥡", name: "Aseptic cartons", note: "Juice boxes, milk cartons" },
    { emoji: "🧴", name: "Empty aerosol cans", note: "Empty and drip-free" },
    { emoji: "🪙", name: "Clean aluminum foil & trays" },
    { emoji: "📕", name: "Hardcover books", note: "Only if damaged — donate good ones" },
    { emoji: "🪚", name: "Small scrap metal", note: "Under 10 lbs" },
  ],
  no: [
    { emoji: "🛍️", name: "Plastic bags & film", note: "Return to grocery store" },
    { emoji: "🧊", name: "Styrofoam", note: "Landfill" },
    { emoji: "🍕", name: "Food-soiled paper", note: "Compost instead" },
    { emoji: "💧", name: "Wet or shredded paper" },
    { emoji: "💡", name: "Light bulbs", note: "HHW drop-off" },
    { emoji: "🔋", name: "Batteries", note: "See Special Items" },
    { emoji: "🪞", name: "Mirrors, window glass" },
    { emoji: "💳", name: "Greeting cards with electronics" },
  ],
};

const ORGANICS: GuideMaterial = {
  bin: "ORGANICS",
  tabLabel: "Compost",
  headerEmoji: "🥦",
  summary: "Green bin — food, food-soiled paper, and plant trimmings.",
  yes: [
    { emoji: "🍎", name: "Fruit & vegetable scraps", note: "Peels, cores, ends" },
    { emoji: "🥩", name: "Meat, fish & bones" },
    { emoji: "🧀", name: "Dairy products" },
    { emoji: "🥚", name: "Eggshells" },
    { emoji: "🍞", name: "Bread, grains, leftovers" },
    { emoji: "☕", name: "Coffee grounds & filters" },
    { emoji: "🫖", name: "Tea bags & loose tea" },
    { emoji: "🧻", name: "Used napkins & paper towels" },
    { emoji: "🍕", name: "Greasy pizza boxes", note: "Tear into smaller pieces" },
    { emoji: "📰", name: "Waxed cardboard" },
    { emoji: "🌿", name: "Yard trimmings & leaves" },
    { emoji: "🌸", name: "Flowers & house plants" },
    { emoji: "🪵", name: "Untreated wood scraps" },
    { emoji: "🍷", name: "Natural wine corks", note: "Real cork only" },
    { emoji: "🌳", name: "Branches", note: "Cut to fit, lid must close" },
  ],
  no: [
    { emoji: "🛍️", name: "Plastic bags", note: "Even compostable-labeled bags" },
    { emoji: "♻️", name: "BPI-compostable plastics", note: "Goes to landfill in Alameda" },
    { emoji: "💩", name: "Pet waste", note: "Landfill — bagged" },
    { emoji: "🍼", name: "Diapers", note: "Landfill" },
    { emoji: "🎨", name: "Treated or painted wood" },
    { emoji: "💧", name: "Liquids", note: "Drain first" },
  ],
};

const LANDFILL: GuideMaterial = {
  bin: "TRASH",
  tabLabel: "Landfill",
  headerEmoji: "🗑️",
  summary: "Gray bin — only what can't be composted or recycled.",
  yes: [
    { emoji: "🍼", name: "Diapers" },
    { emoji: "💩", name: "Pet waste", note: "Bag before tossing" },
    { emoji: "🧊", name: "Styrofoam" },
    { emoji: "🧽", name: "Synthetic sponges" },
    { emoji: "🥤", name: "Single-use plastics", note: "Straws, utensils, cups" },
    { emoji: "🎁", name: "Multi-layer plastic wrap", note: "Chip bags, snack wrappers" },
    { emoji: "🍫", name: "Foil-lined wrappers" },
    { emoji: "🧹", name: "Broken dishes & ceramics", note: "Wrap in paper" },
    { emoji: "💡", name: "Incandescent light bulbs" },
    { emoji: "🪥", name: "Toothbrushes & dental floss" },
    { emoji: "🧴", name: "Empty toothpaste tubes" },
    { emoji: "🚬", name: "Cigarette butts" },
    { emoji: "🪞", name: "Mirrors", note: "Small pieces only" },
    { emoji: "🪝", name: "Wire hangers" },
    { emoji: "🧾", name: "Wax paper & receipts" },
    { emoji: "♻️", name: "BPI-compostable plastics", note: "Yes, here — not in compost" },
  ],
  no: [
    { emoji: "🥬", name: "Food scraps", note: "Compost" },
    { emoji: "📦", name: "Cardboard", note: "Recycling" },
    { emoji: "🥫", name: "Metal cans", note: "Recycling" },
    { emoji: "🔋", name: "Batteries", note: "Special Items" },
    { emoji: "🖥️", name: "Electronics", note: "HHW drop-off" },
    { emoji: "💊", name: "Medications", note: "Pharmacy take-back" },
    { emoji: "🎨", name: "Paint", note: "HHW drop-off" },
  ],
};

const SPECIAL: GuideMaterial = {
  bin: "SPECIAL",
  tabLabel: "Special",
  headerEmoji: "⭐",
  summary: "Items that need their own collection method.",
  yes: [
    {
      emoji: "🔋",
      name: "Household batteries",
      note: "Sealed clear plastic bag on top of recycling cart, terminals taped",
    },
    {
      emoji: "🛢️",
      name: "Motor oil & filters",
      note: "Sealed jugs beside blue cart — 3 gal max, ask hauler for free jugs",
    },
    {
      emoji: "🍳",
      name: "Cooking oil & grease",
      note: "Screw-top container, 3 gal max weekly",
    },
    {
      emoji: "🎄",
      name: "Christmas trees",
      note: "Unbagged, under 6 ft, undecorated — Dec 26 to Jan 31",
    },
    {
      emoji: "🛋️",
      name: "Bulky items (furniture, mattresses)",
      note: "Call your hauler for a free annual pickup",
    },
    {
      emoji: "🖥️",
      name: "E-waste (TVs, computers, phones)",
      note: "Free drop-off at HHW facility — see HHW page",
    },
    {
      emoji: "💡",
      name: "Fluorescent bulbs & CFLs",
      note: "HHW drop-off — do not break",
    },
    {
      emoji: "💊",
      name: "Medications & sharps",
      note: "Pharmacy take-back or kiosk — never in bins",
    },
  ],
  no: [],
};

const SHARED_TIPS = [
  "When in doubt, throw it out — contamination ruins whole loads.",
  "Empty and rinse containers before recycling.",
  "Break down cardboard so it fits flat in the bin.",
  "Bag pet waste before placing in landfill — never in organics.",
];

/* ─── Per-county guides ─────────────────────────────────────────── */

const ALAMEDA: CountyGuide = {
  materials: [RECYCLING, ORGANICS, LANDFILL, SPECIAL],
  tips: [
    ...SHARED_TIPS,
    "StopWaste / RE:Source curbside guide has an A–Z item lookup — link above.",
    "Alameda County Industries (ACI): (510) 483-1400 for bulky pickup.",
  ],
};

const CONTRA_COSTA: CountyGuide = {
  materials: [RECYCLING, ORGANICS, LANDFILL, SPECIAL],
  tips: [
    ...SHARED_TIPS,
    "Contra Costa shares StopWaste's curbside rules with Alameda — link above.",
  ],
};

// SF has its own stricter program (Recology). Slightly different copy
// in a few places where the rules diverge most.
const SAN_FRANCISCO: CountyGuide = {
  materials: [
    {
      ...RECYCLING,
      summary:
        "Blue bin — clean, dry, and empty. Recology takes #1–#7 plastics.",
    },
    {
      ...ORGANICS,
      summary:
        "Green bin — Recology composts ALL food scraps, including BPI-certified compostable products (unlike Alameda).",
      no: ORGANICS.no.filter((i) => i.name !== "BPI-compostable plastics"),
    },
    {
      ...LANDFILL,
      yes: LANDFILL.yes.filter((i) => i.name !== "BPI-compostable plastics"),
    },
    SPECIAL,
  ],
  tips: [
    ...SHARED_TIPS,
    "SF Environment has a searchable item-by-item guide — link above.",
    "SF accepts #1–#7 rigid plastics; check the agency guide for exceptions.",
  ],
};

const SAN_MATEO: CountyGuide = {
  materials: [RECYCLING, ORGANICS, LANDFILL, SPECIAL],
  tips: [
    ...SHARED_TIPS,
    "RecycleStuff.org has a searchable A–Z item lookup — link above.",
  ],
};

const DEFAULT_GUIDE: CountyGuide = {
  materials: [RECYCLING, ORGANICS, LANDFILL, SPECIAL],
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

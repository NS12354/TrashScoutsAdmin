export type HHWCategory = {
  key: string;
  name: string;
  blurb: string;
  icon: "paint" | "battery" | "bulb" | "spray" | "pill" | "phone" | "fuel";
};

// Universal HHW category list. Property-specific drop-off info lives in
// `Property.hhwInstructions`; this set is the same for every property.
export const HHW_CATEGORIES: HHWCategory[] = [
  {
    key: "paint",
    name: "Paint & solvents",
    blurb: "Latex, oil-based paints, stains, thinners — never down the drain.",
    icon: "paint",
  },
  {
    key: "batteries",
    name: "Batteries",
    blurb: "Lithium-ion, alkaline, button. Tape terminals before transport.",
    icon: "battery",
  },
  {
    key: "bulbs",
    name: "Lightbulbs",
    blurb: "CFLs and fluorescent tubes contain mercury — handle with care.",
    icon: "bulb",
  },
  {
    key: "chemicals",
    name: "Cleaning chemicals",
    blurb: "Bleach, ammonia, pool chemicals. Keep in original containers.",
    icon: "spray",
  },
  {
    key: "medications",
    name: "Medications",
    blurb: "Pills, liquids, sharps. Use a take-back program when available.",
    icon: "pill",
  },
  {
    key: "electronics",
    name: "Electronics",
    blurb: "Phones, laptops, TVs, monitors — e-waste, never the trash.",
    icon: "phone",
  },
  {
    key: "fuels",
    name: "Fuels & motor oil",
    blurb: "Gasoline, antifreeze, propane. Many auto stores accept used oil.",
    icon: "fuel",
  },
];

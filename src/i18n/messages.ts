// Central message catalog. Today only English; Spanish stubs are wired up
// so a future translator can fill them in without touching components.
//
// Why a hand-rolled catalog instead of `next-intl` or `react-intl`:
//   - The resident UI only has a handful of strings.
//   - SSG is preserved (route-based locales add complexity).
//   - Adding next-intl later is a one-day change.
//
// Pattern: t("home.title") returns the string in the current locale, falling
// back to English for keys not yet translated.

export type Locale = "en" | "es";

const en = {
  home: {
    title: "Find your building",
    subtitle:
      "Tap your address to see your trash schedule, porter, and reporting tools.",
  },
  porter: {
    sectionLabel: "Meet your Trash Scout",
    authorized: "Authorized {brand} staff",
    unassigned: "No Trash Scout assigned yet.",
  },
  tiles: {
    setupPhotos: "Setup Photos",
    schedule: "Service Schedule",
    report: "Report an Issue",
    hhw: "Hazardous Waste Guide",
    recycling: "Recycling Guide",
  },
  report: {
    title: "Report an issue",
    subtitle: "{property} — no account needed.",
    category: "Issue category",
    description: "Issue description",
    optional: "(optional)",
    pickOne: "Pick one…",
    descriptionPlaceholder: "What did you see?",
    photosLabel: "Attach photos",
    photosHint: "(up to {max})",
    takePhoto: "Take photo",
    upload: "Upload",
    nameContact: "Name & contact",
    namePlaceholder: "Your name",
    contactPlaceholder: "Email or phone (for follow-up)",
    submit: "Submit Report",
    submitting: "Submitting…",
  },
  success: {
    title: "Submitted",
    body: "Thanks — your report is on its way to the Trash Scouts team.",
    backHome: "Back to home",
    readHHW: "Read the HHW guide",
  },
  schedule: {
    title: "Service schedule",
    nextPickup: "Next pickup",
    binsGoOut: "Bins go out",
    binsComeIn: "Bins come in",
    today: "Today",
    tomorrow: "Tomorrow",
    none: "No schedule set yet.",
  },
  setup: {
    title: "Setup photos",
    subtitle: "{property} — how the trash room should look.",
    none: "No setup photos yet.",
  },
  hhw: {
    title: "Hazardous waste guide",
    perProperty: "For this property",
    none: "No property-specific HHW rules yet.",
    commonCategories: "Common categories",
    dropoffs: "Drop-off facilities",
    nearestFirst: " — nearest first",
    fullReference: "Full safety reference",
  },
  guide: {
    title: "Waste & recycling guide",
  },
  errors: {
    notFound: "Page not found",
    generic: "Something went wrong",
    tryAgain: "Try again",
  },
} as const;

type Messages = typeof en;
type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };

const es: DeepPartial<Messages> = {
  // TODO: have a Spanish-speaking team member translate. Anything missing
  // here falls back to English.
};

const catalogs: Record<Locale, DeepPartial<Messages>> = { en, es };

// Resolve "home.title" → string for the current locale.
export function t(
  key: string,
  vars?: Record<string, string | number>,
  locale: Locale = "en",
): string {
  const segments = key.split(".");
  const lookup = (cat: DeepPartial<Messages>) => {
    let cur: unknown = cat;
    for (const s of segments) {
      if (cur && typeof cur === "object" && s in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[s];
      } else {
        return undefined;
      }
    }
    return typeof cur === "string" ? cur : undefined;
  };

  const raw = lookup(catalogs[locale]) ?? lookup(catalogs.en) ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  );
}

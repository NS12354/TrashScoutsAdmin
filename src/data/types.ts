// Shape of all resident-facing content. We're hand-editing TS files for now;
// when admin is built later, swap these accessors for DB calls and the
// resident UI keeps working unchanged.

export type Porter = {
  id: string;
  name: string;
  title?: string; // e.g. "Field Supervisor since 2020"
  photoUrl?: string; // path under /public, e.g. "/porters/sergio.jpg"
};

export type ScheduleItem = {
  dayOfWeek: number; // 0 Sun … 6 Sat
  binType:
    | "TRASH"
    | "RECYCLING"
    | "ORGANICS"
    | "FIBER"
    | "BOTTLES_CANS"
    | "OTHER";
  action: "PULL_OUT" | "RETURN" | "SERVICE_DAY";
  binCount?: number;
  timeWindow?: string; // e.g. "6pm - 9pm"
  notes?: string;
};

export type SetupPhoto = {
  url: string; // path under /public or external URL
  caption?: string; // heading (e.g. "Trash Room 1")
  subcaption?: string; // details (e.g. "3 trash · 2 recycling")
};

export type Property = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  porterId?: string; // day-shift porter (legacy field)
  nightPorterId?: string;
  county?: string; // value from COUNTY_OPTIONS in lib/format.ts
  hhwInstructions?: string;
  setupPhotos?: SetupPhoto[];
  schedule?: ScheduleItem[];
};

export type Guide = {
  title: string;
  content: string; // markdown-ish (`## headings` and `- bullets`)
};

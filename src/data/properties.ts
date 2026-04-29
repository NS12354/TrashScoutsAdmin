import type { Property, ScheduleItem } from "./types";

// Default pickup schedule used by all properties for the demo. Replace
// per-property when Trash Scouts shares real schedules.
const STANDARD_SCHEDULE: ScheduleItem[] = [
  { dayOfWeek: 2, binType: "TRASH", action: "PULL_OUT" },
  { dayOfWeek: 3, binType: "RECYCLING", action: "PULL_OUT" },
  { dayOfWeek: 4, binType: "ORGANICS", action: "PULL_OUT" },
];

// Each entry powers one /p/<id> page. To add a building:
//   1. Pick a stable `id` (becomes the URL: /p/<id>).
//   2. Get the lat/lng — right-click the building in Google Maps and
//      click the coordinate readout to copy them.
//   3. Add the schedule, setup photos, and any property-specific HHW
//      instructions if/when Trash Scouts shares them.
//   4. Drop setup photos into /public/setup/<filename> and reference them
//      under setupPhotos.
//
// The four IDs below match the QR-code locations Trash Scouts shared.
export const PROPERTIES: Property[] = [
  {
    id: "1919-market",
    name: "1919 Market Street",
    address: "1919 Market St, Oakland, CA 94607",
    latitude: 37.8083,
    longitude: -122.2741,
    porterId: "sergio",
    schedule: STANDARD_SCHEDULE,
    setupPhotos: [],
  },
  {
    id: "378-embarcadero",
    name: "378 Embarcadero West",
    address: "378 Embarcadero West, Oakland, CA 94607",
    latitude: 37.7951,
    longitude: -122.2766,
    porterId: "sergio",
    schedule: STANDARD_SCHEDULE,
    setupPhotos: [],
  },
  {
    id: "1955-broadway",
    name: "1955 Broadway",
    address: "1955 Broadway, Oakland, CA 94612",
    latitude: 37.8123,
    longitude: -122.2691,
    porterId: "sergio",
    schedule: STANDARD_SCHEDULE,
    setupPhotos: [],
  },
  {
    id: "950-shorepoint",
    name: "950 Shorepoint Court",
    address: "950 Shorepoint Ct, Alameda, CA 94501",
    latitude: 37.7711,
    longitude: -122.265,
    porterId: "sergio",
    schedule: STANDARD_SCHEDULE,
    setupPhotos: [],
  },
];

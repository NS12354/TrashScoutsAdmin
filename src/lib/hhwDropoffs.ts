export type HHWDropoff = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  hours: string[];
  closures: string;
  notes?: string;
};

// Source: https://www.stopwaste.org/recycling-disposal/hazardous-waste/household-hazardous-waste/drop-off-facilities
// StopWaste runs the regional Alameda County facilities. Update this list
// against the source link above periodically.
export const HHW_DROPOFFS: HHWDropoff[] = [
  {
    name: "Oakland HHW Facility",
    address: "2100 East 7th Street, Oakland, CA",
    latitude: 37.7806,
    longitude: -122.2497,
    hours: [
      "Wed – Fri: 9:00 AM – 2:30 PM",
      "Sat: 9:00 AM – 4:00 PM",
    ],
    closures: "Closed Sun – Tue, plus July 4, Nov 23–28, Dec 21–26",
  },
  {
    name: "Hayward HHW Facility",
    address: "2091 West Winton Ave., Hayward, CA",
    latitude: 37.6363,
    longitude: -122.1031,
    hours: [
      "Thu – Fri: 9:00 AM – 2:30 PM",
      "Sat: 9:00 AM – 4:00 PM",
    ],
    closures: "Closed Sun – Wed, plus July 4, Nov 23–28, Dec 21–26",
  },
  {
    name: "Livermore HHW Facility",
    address: "5584 La Ribera St., Livermore, CA",
    latitude: 37.6904,
    longitude: -121.7706,
    hours: [
      "Thu – Fri: 9:00 AM – 2:30 PM",
      "Sat: 9:00 AM – 4:00 PM",
    ],
    closures: "Closed Sun – Wed, plus July 4, Nov 23–28, Dec 21–26",
  },
  {
    name: "Fremont HHW Facility",
    address: "41149 Boyce Road, Fremont, CA",
    latitude: 37.5275,
    longitude: -121.9617,
    hours: [
      "Wed – Fri: 8:30 AM – 2:30 PM",
      "Sat: 8:30 AM – 4:30 PM",
    ],
    closures: "Closed Sun – Tue, plus July 4, Nov 26, Dec 25",
    notes:
      "Full-service transfer station — also accepts recyclables and construction/demolition waste.",
  },
];

export const HHW_DROPOFFS_SOURCE_URL =
  "https://www.stopwaste.org/recycling-disposal/hazardous-waste/household-hazardous-waste/drop-off-facilities";

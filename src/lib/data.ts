import { PROPERTIES } from "@/data/properties";
import { PORTERS } from "@/data/porters";
import { WASTE_GUIDE, HHW_GENERAL_GUIDE } from "@/data/guides";
import { haversineMeters } from "./geo";
import type { Property, Porter, Guide } from "@/data/types";

export function getAllProperties(): Property[] {
  return PROPERTIES;
}

export function getProperty(id: string): Property | null {
  return PROPERTIES.find((p) => p.id === id) ?? null;
}

export function getPorter(id: string | undefined): Porter | null {
  if (!id) return null;
  return PORTERS.find((p) => p.id === id) ?? null;
}

export function getWasteGuide(): Guide {
  return WASTE_GUIDE;
}

export function getHHWGeneralGuide(): Guide {
  return HHW_GENERAL_GUIDE;
}

export function findNearestProperty(lat: number, lng: number): {
  property: Property;
  distance: number;
} | null {
  let best: { property: Property; distance: number } | null = null;
  for (const p of PROPERTIES) {
    const d = haversineMeters(lat, lng, p.latitude, p.longitude);
    if (!best || d < best.distance) best = { property: p, distance: d };
  }
  return best;
}

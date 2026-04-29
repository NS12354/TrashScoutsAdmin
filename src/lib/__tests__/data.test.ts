import { describe, expect, it } from "vitest";
import {
  findNearestProperty,
  getAllProperties,
  getHHWGeneralGuide,
  getPorter,
  getProperty,
  getWasteGuide,
} from "../data";

describe("data accessors", () => {
  it("returns the four seeded properties", () => {
    const all = getAllProperties();
    expect(all).toHaveLength(4);
    const ids = all.map((p) => p.id).sort();
    expect(ids).toEqual([
      "1919-market",
      "1955-broadway",
      "378-embarcadero",
      "950-shorepoint",
    ]);
  });

  it("returns null for unknown property id", () => {
    expect(getProperty("does-not-exist")).toBeNull();
  });

  it("returns the assigned porter for each property", () => {
    for (const p of getAllProperties()) {
      const porter = getPorter(p.porterId);
      expect(porter?.name).toBe("Sergio Carrillo");
    }
  });

  it("getPorter returns null for unknown id and undefined", () => {
    expect(getPorter("nope")).toBeNull();
    expect(getPorter(undefined)).toBeNull();
  });

  it("returns shared waste + HHW guides", () => {
    expect(getWasteGuide().content).toContain("Recycling");
    expect(getHHWGeneralGuide().content).toContain("Hazardous");
  });
});

describe("findNearestProperty", () => {
  it("returns the closest property when given coords", () => {
    // Right at 1919 Market in Oakland (37.8083, -122.2741)
    const result = findNearestProperty(37.8083, -122.2741);
    expect(result?.property.id).toBe("1919-market");
    expect(result?.distance).toBeLessThan(50);
  });

  it("returns the closest of multiple candidates", () => {
    // Closer to 950 Shorepoint in Alameda (37.7711, -122.265)
    const result = findNearestProperty(37.77, -122.265);
    expect(result?.property.id).toBe("950-shorepoint");
  });
});

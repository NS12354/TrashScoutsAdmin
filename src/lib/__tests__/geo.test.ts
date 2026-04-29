import { describe, expect, it } from "vitest";
import { formatDistance, haversineMeters } from "../geo";

describe("haversineMeters", () => {
  it("returns 0 for identical points", () => {
    expect(haversineMeters(40.7, -74, 40.7, -74)).toBe(0);
  });

  it("computes a known distance within tolerance (NYC ↔ LA)", () => {
    // NYC: 40.7128, -74.0060
    // LA: 34.0522, -118.2437
    // Real great-circle distance ≈ 3,944 km.
    const meters = haversineMeters(40.7128, -74.006, 34.0522, -118.2437);
    expect(meters).toBeGreaterThan(3_930_000);
    expect(meters).toBeLessThan(3_960_000);
  });

  it("is symmetric", () => {
    const a = haversineMeters(37.7749, -122.4194, 34.0522, -118.2437);
    const b = haversineMeters(34.0522, -118.2437, 37.7749, -122.4194);
    expect(a).toBeCloseTo(b, 5);
  });
});

describe("formatDistance", () => {
  it("uses meters under 1km", () => {
    expect(formatDistance(0)).toBe("0 m");
    expect(formatDistance(450)).toBe("450 m");
    expect(formatDistance(999)).toBe("999 m");
  });

  it("rounds to one decimal under 10km", () => {
    expect(formatDistance(1500)).toBe("1.5 km");
    expect(formatDistance(9999)).toBe("10.0 km");
  });

  it("rounds to whole km at 10km+", () => {
    expect(formatDistance(15_000)).toBe("15 km");
    expect(formatDistance(2_000_000)).toBe("2000 km");
  });
});

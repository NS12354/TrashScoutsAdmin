import { describe, expect, it } from "vitest";
import { rateLimit } from "../rateLimit";

describe("rateLimit", () => {
  it("allows requests up to the limit", () => {
    const id = `test-${Date.now()}-${Math.random()}`;
    const config = { limit: 3, windowMs: 60_000 };
    expect(rateLimit(id, config).ok).toBe(true);
    expect(rateLimit(id, config).ok).toBe(true);
    expect(rateLimit(id, config).ok).toBe(true);
    expect(rateLimit(id, config).ok).toBe(false);
  });

  it("isolates different identifiers", () => {
    const a = `a-${Date.now()}-${Math.random()}`;
    const b = `b-${Date.now()}-${Math.random()}`;
    const config = { limit: 1, windowMs: 60_000 };
    expect(rateLimit(a, config).ok).toBe(true);
    expect(rateLimit(b, config).ok).toBe(true);
    expect(rateLimit(a, config).ok).toBe(false);
    expect(rateLimit(b, config).ok).toBe(false);
  });

  it("returns the correct remaining + resetIn", () => {
    const id = `remaining-${Date.now()}-${Math.random()}`;
    const config = { limit: 5, windowMs: 60_000 };
    const r1 = rateLimit(id, config);
    expect(r1.ok).toBe(true);
    expect(r1.remaining).toBe(4);
    expect(r1.resetIn).toBeGreaterThan(0);
    const r2 = rateLimit(id, config);
    expect(r2.remaining).toBe(3);
  });

  it("rolls over after the window expires", async () => {
    const id = `rollover-${Date.now()}-${Math.random()}`;
    const config = { limit: 1, windowMs: 50 };
    expect(rateLimit(id, config).ok).toBe(true);
    expect(rateLimit(id, config).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 80));
    expect(rateLimit(id, config).ok).toBe(true);
  });
});

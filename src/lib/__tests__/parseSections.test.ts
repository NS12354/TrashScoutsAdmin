import { describe, expect, it } from "vitest";
import { parseSections } from "../parseSections";

describe("parseSections", () => {
  it("returns empty array for empty input", () => {
    expect(parseSections("")).toEqual([]);
  });

  it("treats content before any heading as an intro", () => {
    const out = parseSections("Some intro text.\n\n## Heading\nBody");
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ heading: "Overview", intro: true });
    expect(out[1]).toMatchObject({ heading: "Heading" });
  });

  it("splits multiple ## headings", () => {
    const out = parseSections(`## A
body a
## B
body b
## C
body c`);
    expect(out.map((s) => s.heading)).toEqual(["A", "B", "C"]);
    expect(out[0]?.body).toBe("body a");
  });

  it("trims trailing whitespace in body", () => {
    const out = parseSections("## A\nbody a\n\n");
    expect(out[0]?.body).toBe("body a");
  });
});

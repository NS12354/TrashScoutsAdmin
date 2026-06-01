import { describe, expect, it } from "vitest";
import { issueCategoryLabel, renderGuide } from "../format";

describe("issueCategoryLabel", () => {
  it("returns the friendly label for known categories", () => {
    expect(issueCategoryLabel("BROKEN_BIN")).toBe("Broken Bin");
    expect(issueCategoryLabel("MISSING_BINS")).toBe("Missing Bins");
    expect(issueCategoryLabel("OTHER")).toBe("Other");
  });

  it("returns the raw key for unknown categories (defensive)", () => {
    expect(issueCategoryLabel("UNKNOWN_X")).toBe("UNKNOWN_X");
  });
});

describe("renderGuide", () => {
  it("returns empty array for empty input", () => {
    expect(renderGuide("")).toEqual([]);
  });

  it("identifies headings, paragraphs, and bulleted lists", () => {
    const blocks = renderGuide(`## Trash
General garbage.

## Tips
- Empty containers
- Break down cardboard`);
    expect(blocks).toEqual([
      { type: "h", text: "Trash" },
      { type: "p", text: "General garbage." },
      { type: "h", text: "Tips" },
      { type: "ul", items: ["Empty containers", "Break down cardboard"] },
    ]);
  });
});

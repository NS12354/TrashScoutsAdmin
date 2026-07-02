import { describe, expect, it } from "vitest";
import {
  cleanEmailList,
  excludeAddress,
  isEmail,
  MAX_LIST_LEN,
  parseEmailString,
} from "../emailValidation";

describe("isEmail", () => {
  it("accepts well-formed addresses", () => {
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("first.last+tag@example.com")).toBe(true);
    expect(isEmail(" trimmed@example.org ")).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(isEmail("not-an-email")).toBe(false);
    expect(isEmail("missing-domain@")).toBe(false);
    expect(isEmail("@missing-local.com")).toBe(false);
    expect(isEmail("has spaces@example.com")).toBe(false);
    expect(isEmail("no-tld@example")).toBe(false);
    expect(isEmail("")).toBe(false);
  });

  it("returns false for non-string input", () => {
    expect(isEmail(null as unknown as string)).toBe(false);
    expect(isEmail(undefined as unknown as string)).toBe(false);
    expect(isEmail(42 as unknown as string)).toBe(false);
  });
});

describe("parseEmailString", () => {
  it("splits on comma, semicolon, and whitespace", () => {
    expect(parseEmailString("a@x.com, b@y.com")).toEqual([
      "a@x.com",
      "b@y.com",
    ]);
    expect(parseEmailString("a@x.com;b@y.com")).toEqual([
      "a@x.com",
      "b@y.com",
    ]);
    expect(parseEmailString("a@x.com  b@y.com\nc@z.com")).toEqual([
      "a@x.com",
      "b@y.com",
      "c@z.com",
    ]);
  });

  it("trims each token", () => {
    expect(parseEmailString("  a@x.com  ,  b@y.com  ")).toEqual([
      "a@x.com",
      "b@y.com",
    ]);
  });

  it("filters empty tokens from double separators", () => {
    expect(parseEmailString("a@x.com,,b@y.com,;,c@z.com")).toEqual([
      "a@x.com",
      "b@y.com",
      "c@z.com",
    ]);
  });

  it("returns empty for empty input", () => {
    expect(parseEmailString("")).toEqual([]);
    expect(parseEmailString("   ")).toEqual([]);
  });

  it("does NOT validate — parsing is separate from validation", () => {
    // parseEmailString gives you the tokens; cleanEmailList applies
    // the validity check. This lets UI show tokens as chips even
    // when they're mid-typing.
    expect(parseEmailString("not-an-email, a@x.com")).toEqual([
      "not-an-email",
      "a@x.com",
    ]);
  });
});

describe("cleanEmailList", () => {
  it("returns empty for non-array input", () => {
    expect(cleanEmailList(null)).toEqual([]);
    expect(cleanEmailList(undefined)).toEqual([]);
    expect(cleanEmailList("a@x.com")).toEqual([]);
    expect(cleanEmailList({ a: 1 })).toEqual([]);
  });

  it("keeps valid emails and drops invalid ones", () => {
    expect(
      cleanEmailList(["a@x.com", "invalid", "b@y.com", "", null]),
    ).toEqual(["a@x.com", "b@y.com"]);
  });

  it("trims whitespace", () => {
    expect(cleanEmailList(["  a@x.com  ", " b@y.com"])).toEqual([
      "a@x.com",
      "b@y.com",
    ]);
  });

  it("dedupes case-insensitively", () => {
    expect(
      cleanEmailList(["a@x.com", "A@X.COM", "b@y.com", "B@Y.Com"]),
    ).toEqual(["a@x.com", "b@y.com"]);
  });

  it("caps at MAX_LIST_LEN", () => {
    const big = Array.from(
      { length: MAX_LIST_LEN + 5 },
      (_, i) => `p${i}@x.com`,
    );
    expect(cleanEmailList(big)).toHaveLength(MAX_LIST_LEN);
  });

  it("drops entries over 200 chars (defensive against malicious input)", () => {
    const huge = "a".repeat(300) + "@x.com";
    expect(cleanEmailList([huge, "ok@x.com"])).toEqual(["ok@x.com"]);
  });
});

describe("excludeAddress", () => {
  it("removes the primary from the list, case-insensitively", () => {
    expect(
      excludeAddress(["a@x.com", "B@X.COM", "c@x.com"], "a@x.com"),
    ).toEqual(["B@X.COM", "c@x.com"]);
    expect(
      excludeAddress(["a@x.com", "B@X.COM", "c@x.com"], "b@x.com"),
    ).toEqual(["a@x.com", "c@x.com"]);
  });

  it("returns the list unchanged when primary is null/undefined", () => {
    const list = ["a@x.com", "b@y.com"];
    expect(excludeAddress(list, null)).toEqual(list);
    expect(excludeAddress(list, undefined)).toEqual(list);
  });
});

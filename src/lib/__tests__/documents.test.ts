import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATEGORY,
  DOCUMENT_CATEGORIES,
  categoryLabel,
  contentDisposition,
  fileExtension,
  fileKindLabel,
  formatFileSize,
  groupByCategory,
  isAllowedDocument,
  isValidCategory,
  sanitizeFilename,
} from "../documents";

describe("fileExtension", () => {
  it("lowercases and keeps the leading dot", () => {
    expect(fileExtension("SOP.PDF")).toBe(".pdf");
  });

  it("uses only the final segment", () => {
    expect(fileExtension("bin-sop.v2.docx")).toBe(".docx");
  });

  it("returns empty for names with no extension", () => {
    expect(fileExtension("README")).toBe("");
  });

  it("ignores directory components", () => {
    expect(fileExtension("folder.v1/README")).toBe("");
  });

  it("treats a leading dot as a hidden file, not an extension", () => {
    expect(fileExtension(".gitignore")).toBe("");
  });
});

describe("isAllowedDocument", () => {
  it.each([
    "Pull-Out Procedure.pdf",
    "roster.xlsx",
    "training.pptx",
    "notes.txt",
    "photo.JPEG",
    "bundle.zip",
  ])("allows %s", (name) => {
    expect(isAllowedDocument(name)).toBe(true);
  });

  it.each([
    "payload.exe",
    "script.sh",
    "macro.docm",
    "page.html",
    "vector.svg",
    "noextension",
  ])("rejects %s", (name) => {
    expect(isAllowedDocument(name)).toBe(false);
  });

  it("rejects a double extension that ends in an executable", () => {
    expect(isAllowedDocument("invoice.pdf.exe")).toBe(false);
  });
});

describe("fileKindLabel", () => {
  it("maps known extensions to a short badge", () => {
    expect(fileKindLabel("a.pdf")).toBe("PDF");
    expect(fileKindLabel("a.docx")).toBe("Word");
    expect(fileKindLabel("a.xlsx")).toBe("Excel");
  });

  it("falls back to the bare extension for unknown types", () => {
    expect(fileKindLabel("a.dwg")).toBe("DWG");
  });

  it("falls back to File when there is no extension", () => {
    expect(fileKindLabel("README")).toBe("File");
  });
});

describe("formatFileSize", () => {
  it("formats bytes, KB and MB", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe("2.5 MB");
  });

  it("drops the decimal above 10 MB", () => {
    expect(formatFileSize(1024 * 1024 * 12.4)).toBe("12 MB");
  });

  it("handles nonsense input without throwing", () => {
    expect(formatFileSize(NaN)).toBe("—");
    expect(formatFileSize(-1)).toBe("—");
  });
});

describe("sanitizeFilename", () => {
  it("strips directory traversal", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("C:\\Users\\me\\sop.pdf")).toBe("sop.pdf");
  });

  it("strips control characters that could smuggle headers", () => {
    expect(sanitizeFilename("sop\r\nX-Evil: 1.pdf")).toBe("sopX-Evil: 1.pdf");
  });

  it("strips double quotes so the header stays well-formed", () => {
    expect(sanitizeFilename('a"b.pdf')).toBe("ab.pdf");
  });

  it("never returns an empty string", () => {
    expect(sanitizeFilename("...")).toBe("download");
    expect(sanitizeFilename("")).toBe("download");
  });

  it("keeps ordinary names intact", () => {
    expect(sanitizeFilename("Bin Pull-Out SOP v2.pdf")).toBe(
      "Bin Pull-Out SOP v2.pdf",
    );
  });
});

describe("contentDisposition", () => {
  it("always marks the response as an attachment", () => {
    expect(contentDisposition("sop.pdf")).toBe(
      `attachment; filename="sop.pdf"; filename*=UTF-8''sop.pdf`,
    );
  });

  it("keeps non-ascii names in the encoded form and substitutes the fallback", () => {
    const header = contentDisposition("Résumé.docx");
    expect(header).toContain('filename="R_sum_.docx"');
    expect(header).toContain("filename*=UTF-8''R%C3%A9sum%C3%A9.docx");
  });

  it("cannot be broken out of with quotes or newlines", () => {
    const header = contentDisposition('e"vil\r\n.pdf');
    expect(header).not.toContain("\r");
    expect(header).not.toContain("\n");
    expect(header.match(/"/g)).toHaveLength(2);
  });
});

describe("categories", () => {
  it("validates known values only", () => {
    expect(isValidCategory("SAFETY")).toBe(true);
    expect(isValidCategory("safety")).toBe(false);
    expect(isValidCategory("NOPE")).toBe(false);
  });

  it("labels known values and passes unknown ones through", () => {
    expect(categoryLabel("FIELD_OPS")).toBe("Field Operations");
    expect(categoryLabel("MYSTERY")).toBe("MYSTERY");
  });

  it("includes the default category in the option list", () => {
    expect(DOCUMENT_CATEGORIES.map((c) => c.value)).toContain(DEFAULT_CATEGORY);
  });
});

describe("groupByCategory", () => {
  const docs = [
    { id: "1", category: "SAFETY" },
    { id: "2", category: "FIELD_OPS" },
    { id: "3", category: "SAFETY" },
  ];

  it("groups in DOCUMENT_CATEGORIES order, not insertion order", () => {
    const groups = groupByCategory(docs);
    expect(groups.map((g) => g.value)).toEqual(["FIELD_OPS", "SAFETY"]);
    const safety = groups.find((g) => g.value === "SAFETY");
    expect(safety?.docs.map((d) => d.id)).toEqual(["1", "3"]);
  });

  it("omits empty categories", () => {
    expect(groupByCategory([]).length).toBe(0);
    expect(groupByCategory(docs).map((g) => g.value)).not.toContain("HR");
  });

  it("folds unknown categories into Other rather than dropping them", () => {
    const [only] = groupByCategory([{ id: "x", category: "LEGACY_VALUE" }]);
    expect(only?.value).toBe(DEFAULT_CATEGORY);
    expect(only?.docs.map((d) => d.id)).toEqual(["x"]);
  });

  it("does not duplicate a doc across groups", () => {
    const all = groupByCategory(docs).flatMap((g) => g.docs.map((d) => d.id));
    expect(all).toHaveLength(docs.length);
    expect(new Set(all).size).toBe(docs.length);
  });
});

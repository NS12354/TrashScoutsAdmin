import { describe, expect, it, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Mock @/lib/email BEFORE importing the module under test so its
// module-level `import { sendEmail } from "./email"` binds to the
// stub. `vi.hoisted` lets the mock factory access the shared spy
// without hitting the "variables can't be used before init" hoist
// error.
const { mockSendEmail } = vi.hoisted(() => {
  return { mockSendEmail: vi.fn() };
});
vi.mock("../email", () => ({
  sendEmail: mockSendEmail,
  escapeHtml: (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;"),
}));

// Stub global fetch so the brochure-fetch code path doesn't hit
// the network. Tests that care about the attachment set their own
// fetch impl per-case.
const originalFetch = globalThis.fetch;

import {
  sendProposalReadyEmail,
  sendSignedAgreementEmails,
} from "../proposalEmails";

beforeEach(() => {
  mockSendEmail.mockReset();
  mockSendEmail.mockResolvedValue({ ok: true });
  globalThis.fetch = originalFetch;
  delete process.env.BROCHURE_PDF_URL;
});

/* ─── Proposal-sent email ──────────────────────────────────────── */

describe("sendProposalReadyEmail", () => {
  const baseArgs = {
    primaryTo: "client@a.com",
    extraTos: [] as string[],
    pocEmails: [] as string[],
    clientName: "Pedritos Apts",
    propertyName: "Pedritos Apts",
    serviceAddress: "123 Main St",
    validUntil: new Date("2025-07-22T00:00:00Z"),
    token: "abc",
  };

  it("sends one email per unique recipient (primary + extras + POCs)", async () => {
    await sendProposalReadyEmail({
      ...baseArgs,
      extraTos: ["owner@b.com"],
      pocEmails: ["mgr@ts.com"],
    });
    expect(mockSendEmail).toHaveBeenCalledTimes(3);
    const targets = mockSendEmail.mock.calls.map(
      (c) => (c[0] as { to: string }).to,
    );
    expect(targets).toEqual(
      expect.arrayContaining([
        "client@a.com",
        "owner@b.com",
        "mgr@ts.com",
      ]),
    );
  });

  it("dedupes overlapping recipients across primary / extras / POCs", async () => {
    await sendProposalReadyEmail({
      ...baseArgs,
      extraTos: ["client@a.com", "OWNER@B.COM"],
      pocEmails: ["client@a.com", "owner@b.com"],
    });
    // client@a.com + owner@b.com (case-insensitive dedupe)
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });

  it("does NOT include monthly price in the body", async () => {
    await sendProposalReadyEmail(baseArgs);
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    expect(html).not.toMatch(/monthly rate/i);
    expect(html).not.toMatch(/\/mo\b/);
    expect(html).not.toMatch(/\$\d/);
  });

  it("mentions the property name + address", async () => {
    await sendProposalReadyEmail(baseArgs);
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    expect(html).toContain("Pedritos Apts");
    expect(html).toContain("123 Main St");
  });

  it("shows Pricing Valid Through with the formatted date", async () => {
    await sendProposalReadyEmail(baseArgs);
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    expect(html).toContain("Pricing Valid Through");
    // Date can render as either July 21 or 22 depending on the
    // machine's timezone offset — accept either.
    expect(html).toMatch(/July (21|22), 2025/);
  });

  it("falls back to no property line when name/address are null", async () => {
    // Use a distinct clientName so the assertion on property isolation
    // isn't confused by the greeting line (which uses clientName).
    await sendProposalReadyEmail({
      ...baseArgs,
      clientName: "Prospective Client",
      propertyName: null,
      serviceAddress: null,
    });
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    // Without a property, we still greet the client and give the
    // generic "is ready to review" line — no property mention at all.
    expect(html).toContain("proposal is ready to review");
    expect(html).not.toContain("Pedritos Apts");
    expect(html).not.toContain("123 Main St");
  });

  it("includes an inline admin note when provided", async () => {
    await sendProposalReadyEmail({
      ...baseArgs,
      message: "Let me know if anything looks off.",
    });
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    expect(html).toContain("Let me know if anything looks off.");
  });

  it("attaches the brochure PDF when BROCHURE_PDF_URL is set", async () => {
    process.env.BROCHURE_PDF_URL = "https://example.com/brochure.pdf";
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
    })) as unknown as typeof fetch;

    await sendProposalReadyEmail(baseArgs);
    const call = mockSendEmail.mock.calls[0]![0] as {
      attachments?: Array<{ filename: string; content: Buffer }>;
      html: string;
    };
    expect(call.attachments).toBeDefined();
    expect(call.attachments![0]!.filename).toMatch(/\.pdf$/);
    expect(call.html).toMatch(/brochure is attached/i);
  });

  it("silently skips the attachment when fetch fails", async () => {
    process.env.BROCHURE_PDF_URL = "https://example.com/brochure.pdf";
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
    })) as unknown as typeof fetch;

    await sendProposalReadyEmail(baseArgs);
    const call = mockSendEmail.mock.calls[0]![0] as {
      attachments?: unknown;
    };
    expect(call.attachments).toBeUndefined();
  });
});

/* ─── Signed-agreement email ──────────────────────────────────── */

describe("sendSignedAgreementEmails", () => {
  const baseArgs = {
    primaryClientEmail: "client@a.com",
    extraClientEmails: [] as string[],
    clientName: "The Mark",
    signerName: "Jane Manager",
    signerTitle: "Property Manager",
    startDate: "2025-08-01",
    startTbd: false,
    propertyName: "The Mark",
    serviceAddress: "24650 Amador St, Hayward",
    token: "t",
    agreementId: "a",
    pocEmails: [] as string[],
  };

  it("does NOT include monthly rate in the client body", async () => {
    await sendSignedAgreementEmails(baseArgs);
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    expect(html).not.toMatch(/monthly rate/i);
    expect(html).not.toMatch(/\/mo\b/);
    expect(html).not.toMatch(/\/wk\b/);
    expect(html).not.toMatch(/\$\d/);
  });

  it("keeps signer name + title", async () => {
    await sendSignedAgreementEmails(baseArgs);
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    expect(html).toContain("Jane Manager");
    expect(html).toContain("Property Manager");
  });

  it("shows the formatted service start date", async () => {
    await sendSignedAgreementEmails(baseArgs);
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    expect(html).toMatch(/August 1, 2025/);
    expect(html).toMatch(/Service start date/i);
  });

  it("shows 'To be determined' when startTbd is set", async () => {
    await sendSignedAgreementEmails({
      ...baseArgs,
      startDate: null,
      startTbd: true,
    });
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    expect(html).toContain("To be determined");
  });

  it("mentions the property name + service address", async () => {
    await sendSignedAgreementEmails(baseArgs);
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    expect(html).toContain("The Mark");
    expect(html).toContain("24650 Amador St, Hayward");
  });

  it("includes the Welcome Aboard link", async () => {
    await sendSignedAgreementEmails(baseArgs);
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    expect(html).toContain(
      "https://www.trashscouts.com/welcomeaboard/",
    );
  });

  it("includes the onboarding notes (keys/remotes/72 hours + office address)", async () => {
    await sendSignedAgreementEmails(baseArgs);
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    expect(html).toMatch(/72 hours before/i);
    expect(html).toMatch(/keys, remotes/i);
    expect(html).toMatch(/2 copies/);
    expect(html).toContain("520 3rd St #201");
    expect(html).toContain("Oakland, CA 94607");
  });

  it("includes the Smart Scan sign 'coming soon' placeholder", async () => {
    await sendSignedAgreementEmails(baseArgs);
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    expect(html).toMatch(/Smart Scan/i);
    expect(html).toMatch(/Coming Soon/i);
  });

  it("client + extra client emails all get the welcome email; POCs get ops-style", async () => {
    await sendSignedAgreementEmails({
      ...baseArgs,
      extraClientEmails: ["owner@b.com"],
      pocEmails: ["ops@ts.com"],
    });
    expect(mockSendEmail).toHaveBeenCalledTimes(3);

    const [c1, c2, poc] = mockSendEmail.mock.calls.map(
      (c) => c[0] as { to: string; html: string; subject: string },
    );

    // First two are client-side, get onboarding + welcome link.
    for (const c of [c1, c2]) {
      expect(c!.html).toContain("welcomeaboard");
      expect(c!.html).toMatch(/Welcome aboard/i);
    }

    // POC is the concise ops summary — no welcome link, no
    // onboarding block.
    expect(poc!.html).not.toContain("welcomeaboard");
    expect(poc!.html).toMatch(/just signed/i);
    expect(poc!.subject).toMatch(/New signed agreement/);
  });

  it("dedupes extra + POC recipients against the primary client", async () => {
    await sendSignedAgreementEmails({
      ...baseArgs,
      extraClientEmails: ["CLIENT@a.com"],
      pocEmails: ["client@a.com", "ops@ts.com"],
    });
    // primary + ops (extras and pocs that alias the primary are
    // filtered out)
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });

  it("uses the admin-provided thank-you message when set", async () => {
    await sendSignedAgreementEmails({
      ...baseArgs,
      thankYouMessage:
        "Thanks Jane! First service is confirmed for Aug 1.",
    });
    const html = (mockSendEmail.mock.calls[0]![0] as { html: string }).html;
    expect(html).toContain("First service is confirmed for Aug 1.");
  });
});

/* ─── CSS structural checks ─────────────────────────────────── */

describe("proposal.module.css", () => {
  const css = fs.readFileSync(
    path.join(
      __dirname,
      "../../components/proposal/proposal.module.css",
    ),
    "utf8",
  );

  it("defines page-number counters in @page", () => {
    expect(css).toMatch(/@page/);
    expect(css).toMatch(/counter\(page\)/);
    expect(css).toMatch(/counter\(pages\)/);
  });

  it("has a pcloser rule that flexes to the bottom in print", () => {
    expect(css).toMatch(/\.pcloser\b/);
    // In print mode, pcloser becomes flex + margin-top:auto.
    const printBlockStart = css.indexOf("@media print");
    expect(printBlockStart).toBeGreaterThan(-1);
    const printBlock = css.slice(printBlockStart);
    expect(printBlock).toMatch(/margin-top:\s*auto/);
  });

  it("makes .paper a flex column with min-height in print", () => {
    const printBlock = css.slice(css.indexOf("@media print"));
    expect(printBlock).toMatch(/display:\s*flex/);
    expect(printBlock).toMatch(/flex-direction:\s*column/);
    expect(printBlock).toMatch(/min-height:\s*100vh/);
  });
});

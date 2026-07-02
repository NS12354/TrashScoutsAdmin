import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { SERVICE_COPY } from "@/lib/proposalConstants";

// Structural tests over the four surfaces that render proposal or
// agreement content: ProposalView (proposal page + admin preview),
// AgreementForm (in-browser sign), the printable agreement, and
// the signed agreement view. Every surface must handle all four
// service modes consistently.

const ROOT = path.resolve(__dirname, "../../..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const SURFACES: Array<{ label: string; file: string }> = [
  {
    label: "ProposalView",
    file: "src/components/proposal/ProposalView.tsx",
  },
  {
    label: "AgreementForm",
    file: "src/components/proposal/AgreementForm.tsx",
  },
  {
    label: "PrintableAgreement",
    file: "src/app/proposals/[token]/agreement/printable/page.tsx",
  },
  {
    label: "SignedAgreementView",
    file: "src/app/proposals/[token]/signed/[id]/page.tsx",
  },
];

describe("SERVICE_COPY covers all four modes", () => {
  it("has entries for both, pull, cycle, sow", () => {
    expect(SERVICE_COPY.both).toBeDefined();
    expect(SERVICE_COPY.pull).toBeDefined();
    expect(SERVICE_COPY.cycle).toBeDefined();
    expect(SERVICE_COPY.sow).toBeDefined();
  });

  it("hauler modes have body copy; sow has a lead", () => {
    expect(SERVICE_COPY.both.body).toBeTruthy();
    expect(SERVICE_COPY.pull.body).toBeTruthy();
    expect(SERVICE_COPY.cycle.body).toBeTruthy();
    expect(SERVICE_COPY.sow.lead).toBeTruthy();
  });

  it("titles are readable + non-empty", () => {
    for (const key of ["both", "pull", "cycle", "sow"] as const) {
      expect(SERVICE_COPY[key].title).toMatch(/[A-Za-z]/);
    }
  });
});

/* ─── Surface-level structural checks ─────────────────────────── */

describe.each(SURFACES)(
  "$label renders every mode",
  ({ file }) => {
    const src = read(file);

    it("has a modes.map iteration", () => {
      expect(src).toMatch(/modes\.map/);
    });

    it("branches on SOW to render the lead", () => {
      expect(src).toMatch(/m === "sow"/);
      expect(src).toMatch(/SERVICE_COPY\.sow\.lead/);
    });

    it("renders per-stream SOW scope (the fix that dropped the bug)", () => {
      // Look for either the fully-scoped filter+map for SOW streams
      // or the direct sowScope reference somewhere in the mode
      // branch. Any surface missing this is the bug we hit last week
      // where the printable agreement dropped the scope text.
      expect(src).toMatch(/sowScope/);
    });

    it("renders non-SOW body copy for hauler modes", () => {
      expect(src).toMatch(/SERVICE_COPY\[m\]\.body/);
    });

    it("renders a schedule table with three columns", () => {
      // Every surface has "Service Line / Detail / Schedule" (or
      // Service Schedule) as the table header.
      expect(src).toMatch(/Service Line/);
      expect(src).toMatch(/Detail/);
      expect(src).toMatch(/Schedule/);
    });
  },
);

/* ─── Print/PDF CSS is defined + correct ──────────────────────── */

describe("proposal print CSS", () => {
  const css = read("src/components/proposal/proposal.module.css");

  it("defines the paper flex column with min-height in @media print", () => {
    const print = css.slice(css.indexOf("@media print"));
    expect(print).toMatch(/display:\s*flex/);
    expect(print).toMatch(/flex-direction:\s*column/);
    expect(print).toMatch(/min-height:\s*100vh/);
  });

  it("pcloser is margin-top:auto in print (pins rate+footer to bottom)", () => {
    const print = css.slice(css.indexOf("@media print"));
    // pcloser rule appears inside the print block with margin-top:
    // auto so the closing group flexes to the page bottom.
    const pcloserIdx = print.indexOf(".pcloser");
    expect(pcloserIdx).toBeGreaterThan(-1);
    // Look at the rule body (up to the next `}`).
    const ruleBody = print.slice(
      pcloserIdx,
      print.indexOf("}", pcloserIdx),
    );
    expect(ruleBody).toMatch(/margin-top:\s*auto/);
  });

  it("page number counters are declared in @page", () => {
    const pageBlockIdx = css.indexOf("@page");
    expect(pageBlockIdx).toBeGreaterThan(-1);
    // Find matching close brace for @page — @page has nested blocks
    // for @bottom-right etc., so walk brace depth.
    let depth = 0;
    let end = pageBlockIdx;
    for (let i = pageBlockIdx; i < css.length; i++) {
      const ch = css[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    const pageBlock = css.slice(pageBlockIdx, end);
    expect(pageBlock).toMatch(/@bottom-right/);
    expect(pageBlock).toMatch(/counter\(page\)/);
    expect(pageBlock).toMatch(/counter\(pages\)/);
  });

  it("strips shell background + admin chrome in print", () => {
    const print = css.slice(css.indexOf("@media print"));
    expect(print).toMatch(/\.shell\s*\{/);
    expect(print).toMatch(/background:\s*#fff\s*!important/);
    expect(print).toMatch(/\.actions/);
    expect(print).toMatch(/display:\s*none\s*!important/);
  });
});

/* ─── Printable agreement CSS also correct ──────────────────── */

describe("printable agreement print CSS", () => {
  const css = read("src/components/proposal/printable.module.css");

  it("keeps section headers with their content (no orphan headings)", () => {
    const print = css.slice(css.indexOf("@media print"));
    expect(print).toMatch(/break-after:\s*avoid/);
    expect(print).toMatch(/page-break-after:\s*avoid/);
  });

  it("terms flow across pages rather than force-break", () => {
    const print = css.slice(css.indexOf("@media print"));
    // The old rule forced .terms to break-before: page, causing an
    // orphan "TERMS & CONDITIONS" header at the bottom of the
    // previous page. The current rule doesn't have that.
    const termsIdx = print.indexOf(".terms");
    expect(termsIdx).toBeGreaterThan(-1);
    // Look at just the .terms rule body — should NOT contain
    // break-before: page.
    const nextBrace = print.indexOf("}", termsIdx);
    const termsRule = print.slice(termsIdx, nextBrace);
    expect(termsRule).not.toMatch(/break-before:\s*page/);
  });
});

/* ─── ProposalView pcloser wrapping is correct ──────────────── */

describe("ProposalView structure", () => {
  const src = read("src/components/proposal/ProposalView.tsx");

  it("wraps Rate + Optional Add-Ons in a .pcloser div", () => {
    expect(src).toMatch(/styles\.pcloser/);
  });

  it("still renders the Why Trash Scouts + Scope of Work + What's Included sections", () => {
    expect(src).toMatch(/Why Trash Scouts/);
    expect(src).toMatch(/Scope of Work/);
    // JSX escapes the apostrophe as &apos;
    expect(src).toMatch(/What.{1,10}s Included/);
  });

  it("renders Pricing Valid Through with the formatted date", () => {
    expect(src).toMatch(/Pricing Valid Through/);
    expect(src).toMatch(/validUntil/);
  });
});

/* ─── Send button parses multi-emails via shared helper ─────── */

describe("SendProposalButton (PricingTool)", () => {
  const src = read("src/components/admin/PricingTool.tsx");

  it("uses parseEmailString for the client email input", () => {
    expect(src).toMatch(
      /parseEmailString.*\bemail\b|import.*parseEmailString/,
    );
  });

  it("posts clientEmailCcs in the request body", () => {
    expect(src).toMatch(/clientEmailCcs:\s*ccs/);
  });

  it("posts pocEmails in the request body", () => {
    expect(src).toMatch(/pocEmails/);
  });

  it("still has the thank-you + note textareas", () => {
    expect(src).toMatch(/Note to Client/);
    expect(src).toMatch(/Thank-You Message/i);
  });
});

/* ─── Sign API pulls formData details for the signed email ── */

describe("Sign API (/api/proposals/[token]/sign)", () => {
  const src = read("src/app/api/proposals/[token]/sign/route.ts");

  it("passes propertyName + serviceAddress + startDate to the email helper", () => {
    expect(src).toMatch(/propertyName/);
    expect(src).toMatch(/serviceAddress/);
    expect(src).toMatch(/startDate/);
    expect(src).toMatch(/startTbd/);
  });

  it("falls back to proposal-level values when form fields are missing", () => {
    // The route uses ?? to prefer form value, then fall back to
    // proposal.property.*, then to proposal.clientAddress. Grep for
    // the fallback operators.
    expect(src).toMatch(/pickString\(fd,\s*"pname"\)\s*\?\?/);
    expect(src).toMatch(/pickString\(fd,\s*"svcaddr"\)\s*\?\?/);
  });

  it("passes clientEmailCcs from the proposal to extraClientEmails", () => {
    expect(src).toMatch(/extraClientEmails:\s*proposal\.clientEmailCcs/);
  });

  it("passes pocEmails through", () => {
    expect(src).toMatch(/pocEmails:\s*proposal\.pocEmails/);
  });
});

/* ─── Admin Proposals API uses shared email validator ──────── */

describe("Admin proposals POST API", () => {
  const src = read("src/app/api/admin/proposals/route.ts");

  it("imports cleanEmailList + isEmail from the shared helper", () => {
    expect(src).toMatch(
      /from\s+"@\/lib\/emailValidation"|from\s+"@\/lib\/emailValidation/,
    );
    expect(src).toMatch(/cleanEmailList/);
  });

  it("accepts clientEmailCcs in the create body + persists it", () => {
    expect(src).toMatch(/clientEmailCcs\??:/);
    expect(src).toMatch(/clientEmailCcs,/);
  });

  it("passes clientEmailCcs to the email helper as extraTos", () => {
    expect(src).toMatch(
      /extraTos:\s*proposal\.clientEmailCcs|extraTos:\s*clientEmailCcs/,
    );
  });

  it("passes propertyName + serviceAddress from the DB to the email", () => {
    expect(src).toMatch(/propertyName/);
    expect(src).toMatch(/serviceAddress/);
  });
});

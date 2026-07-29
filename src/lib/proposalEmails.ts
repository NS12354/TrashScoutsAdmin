import { randomBytes } from "node:crypto";
import { BRAND_NAME } from "@/lib/brand";
import { escapeHtml, sendEmail } from "@/lib/email";

// 26 char base64url — ~155 bits of entropy. Unguessable, URL-safe,
// no padding chars, copy-pastable.
export function generateProposalToken(): string {
  return randomBytes(20).toString("base64url");
}

export function publicBaseUrl(): string {
  return (
    process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    "https://admin.trashscouts.com"
  );
}

// Brochure delivery has two modes:
// - BROCHURE_PDF_URL: direct .pdf URL → fetched and attached to the
//   proposal email as a real file attachment.
// - BROCHURE_URL: any URL (HTML page, PDF, Google Drive, etc.) → a
//   green "Download Brochure" button is rendered in the email body
//   that links out to it. Works even without a hosted PDF.
// If both are set, the attachment wins and the button is skipped.
// Either can be dropped in — the email still sends fine if both
// are unset.
function brochurePdfUrl(): string | null {
  const url = process.env.BROCHURE_PDF_URL?.trim();
  return url && url.startsWith("http") ? url : null;
}

function brochureLinkUrl(): string | null {
  const url = process.env.BROCHURE_URL?.trim();
  return url && url.startsWith("http") ? url : null;
}

async function fetchBrochureAttachment(): Promise<{
  filename: string;
  content: Buffer;
} | null> {
  const url = brochurePdfUrl();
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[brochure] fetch failed ${res.status} for ${url}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return { filename: `${BRAND_NAME} Brochure.pdf`, content: buf };
  } catch (err) {
    console.warn(`[brochure] fetch error`, err);
    return null;
  }
}

function brandFooter(): string {
  return `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#888;font-family:Arial,sans-serif">
    <div><b>${BRAND_NAME}</b> · Onsite Waste Services</div>
    <div>520 3rd St #201, Oakland, CA 94607 · (510) 788-0462 · <a href="https://www.trashscouts.com" style="color:#16633C">www.trashscouts.com</a></div>
  </div>`;
}

// Build a compact "Property — Address" heading suitable for the
// subject line and body. Falls back gracefully if any piece is
// missing.
function propertyHeading(
  propertyName: string | null | undefined,
  serviceAddress: string | null | undefined,
): string {
  const n = propertyName?.trim();
  const a = serviceAddress?.trim();
  if (n && a) return `${n} — ${a}`;
  return n || a || "";
}

function fmtDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function sendProposalReadyEmail({
  primaryTo,
  extraTos,
  pocEmails,
  clientName,
  propertyName,
  serviceAddress,
  validUntil,
  token,
  preparedBy,
  message,
}: {
  primaryTo: string;
  extraTos: string[];
  pocEmails: string[];
  clientName: string;
  propertyName?: string | null;
  serviceAddress?: string | null;
  validUntil: Date;
  token: string;
  preparedBy?: string | null;
  message?: string | null;
}) {
  const url = `${publicBaseUrl()}/proposals/${encodeURIComponent(token)}`;
  const property = propertyHeading(propertyName, serviceAddress);
  const validUntilStr = fmtDate(validUntil);

  const intro = message?.trim()
    ? `<p style="font-size:15px;line-height:1.6;color:#333">${escapeHtml(message.trim()).replace(/\n/g, "<br>")}</p>`
    : "";

  const propertyLine = property
    ? `<p style="font-size:15px;line-height:1.6;color:#333">Your onsite waste service proposal for <b>${escapeHtml(property)}</b> is ready to review.</p>`
    : `<p style="font-size:15px;line-height:1.6;color:#333">Your onsite waste service proposal is ready to review.</p>`;

  const attachmentBrochure = brochurePdfUrl();
  const linkBrochure = brochureLinkUrl();
  const brochureBlock = attachmentBrochure
    ? `<p style="font-size:14px;line-height:1.55;color:#444;margin-top:20px">Our brochure is attached to this email. It has a quick overview of what we do and how we work with properties like yours.</p>`
    : linkBrochure
      ? `<div style="margin-top:22px;padding:16px 18px;background:#FAFBF9;border:1px solid #E4ECE6;border-radius:10px">
          <div style="font-size:13px;color:#4A5F50;line-height:1.55;margin-bottom:10px">Want a quick overview of what we do and how we work with properties like yours?</div>
          <a href="${linkBrochure}" style="display:inline-block;background:#1FA864;color:#06281A;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:8px;font-size:14px">Open our brochure →</a>
        </div>`
      : "";

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;color:#1A1A1A">
    <h1 style="font-size:22px;margin:0 0 12px;color:#0E3F27">Your service proposal from ${BRAND_NAME}</h1>
    <p style="font-size:15px;line-height:1.6;color:#333">Hi ${escapeHtml(clientName)},</p>
    ${propertyLine}
    <p style="font-size:14px;color:#166337;margin:6px 0 0;font-weight:600">Pricing Valid Through ${escapeHtml(validUntilStr)}</p>
    ${intro}
    <p style="text-align:center;margin:28px 0">
      <a href="${url}" style="display:inline-block;background:#1FA864;color:#06281A;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:10px;font-size:15px">View proposal &amp; accept</a>
    </p>
    <p style="font-size:13px;line-height:1.55;color:#666">You can review the full scope, schedule, and rate at the link above, and accept the proposal online when you're ready.</p>
    ${brochureBlock}
    ${preparedBy ? `<p style="font-size:13px;color:#666;margin-top:18px">Prepared by ${escapeHtml(preparedBy)}</p>` : ""}
    ${brandFooter()}
  </div>`;

  const attachment = await fetchBrochureAttachment();
  const attachments = attachment ? [attachment] : undefined;

  // Dedupe recipients — same person shouldn't get two copies if
  // they're listed as client + POC.
  const primaryLower = primaryTo.trim().toLowerCase();
  const extras = Array.from(
    new Set(extraTos.map((e) => e.trim()).filter(Boolean)),
  ).filter((e) => e.toLowerCase() !== primaryLower);
  const pocs = Array.from(
    new Set(pocEmails.map((e) => e.trim()).filter(Boolean)),
  ).filter(
    (e) =>
      e.toLowerCase() !== primaryLower &&
      !extras.some((x) => x.toLowerCase() === e.toLowerCase()),
  );

  const subject = property
    ? `Your ${BRAND_NAME} proposal — ${property}`
    : `Your ${BRAND_NAME} service proposal`;

  // Send one message per recipient so the brochure attaches without
  // exposing the recipient list in the To/CC headers.
  const targets = [primaryTo, ...extras, ...pocs];
  const results = await Promise.allSettled(
    targets.map((to) =>
      sendEmail({ to, subject, html, attachments }),
    ),
  );
  return summarize(results, targets.length);
}

type SendOutcome = Awaited<ReturnType<typeof sendEmail>>;

// Collapses per-recipient results into something a caller can show a human.
// `delivered` counts messages the provider actually accepted — it used to
// report the number attempted, so a run where every send failed still looked
// like a complete success.
function summarize(
  results: PromiseSettledResult<SendOutcome>[],
  attempted: number,
) {
  const outcomes: SendOutcome[] = results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : {
          ok: false,
          error: r.reason instanceof Error ? r.reason.message : "send failed",
        },
  );
  const failure = outcomes.find((o) => !o.ok);
  return {
    ok: outcomes.every((o) => o.ok !== false),
    delivered: outcomes.filter((o) => o.ok && !o.skipped).length,
    attempted,
    // True only when nothing was even attempted for want of an API key —
    // distinct from a send the provider rejected.
    skipped: outcomes.length > 0 && outcomes.every((o) => o.skipped === true),
    error: failure?.error,
  };
}

export async function sendSignedAgreementEmails({
  primaryClientEmail,
  extraClientEmails,
  clientName,
  signerName,
  signerTitle,
  startDate,
  startTbd,
  propertyName,
  serviceAddress,
  token,
  agreementId,
  thankYouMessage,
  pocEmails,
}: {
  primaryClientEmail: string;
  extraClientEmails: string[];
  clientName: string;
  signerName: string;
  signerTitle?: string | null;
  // From the agreement form's "Requested Start Date" field.
  // startDate is "YYYY-MM-DD" (empty if TBD); startTbd is the
  // explicit "To be determined" flag the client can tick.
  startDate?: string | null;
  startTbd?: boolean;
  propertyName?: string | null;
  serviceAddress?: string | null;
  token: string;
  agreementId: string;
  thankYouMessage?: string | null;
  pocEmails: string[];
}) {
  const url = `${publicBaseUrl()}/proposals/${encodeURIComponent(token)}/signed/${encodeURIComponent(agreementId)}`;
  const welcomeUrl = "https://www.trashscouts.com/welcomeaboard/";
  const property = propertyHeading(propertyName, serviceAddress);
  const startStr =
    startTbd || !startDate
      ? "To be determined"
      : fmtDate(startDate + "T00:00:00");

  // Admin-provided thank-you note replaces the canned intro when
  // set. Plain text → linebreaks become <br>.
  const thankYou = thankYouMessage?.trim()
    ? `<p style="font-size:15px;line-height:1.6;color:#333">${escapeHtml(thankYouMessage.trim()).replace(/\n/g, "<br>")}</p>`
    : `<p style="font-size:15px;line-height:1.6;color:#333">Thanks for accepting your ${BRAND_NAME} service proposal. Your signed agreement is available at the link below — open it and use <b>Save as PDF</b> in your browser to keep a copy.</p>`;

  const detailsList = [
    property
      ? `<li><b>Property:</b> ${escapeHtml(property)}</li>`
      : "",
    `<li><b>Signed by:</b> ${escapeHtml(signerName)}${
      signerTitle ? `, ${escapeHtml(signerTitle)}` : ""
    }</li>`,
    `<li><b>Service start date:</b> ${escapeHtml(startStr)}</li>`,
  ]
    .filter(Boolean)
    .join("");

  // Onboarding notes — copy pasted verbatim from the stakeholder
  // brief so tone matches Trash Scouts' voice. The Smart Scan sign
  // block is a placeholder ("coming soon") while we source signs.
  const onboardingHtml = `<div style="margin-top:26px;padding:18px 20px;background:#F7F6F1;border:1px solid #ECEAE2;border-radius:12px">
    <div style="font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#0E3F27;margin-bottom:10px">A Few Important Notes to Get Started</div>
    <p style="font-size:14px;line-height:1.6;color:#333;margin:0 0 12px">We will need any <b>keys, remotes, or access codes</b> at least <b>72 hours before the service start date</b>. We request <b>2 copies</b>.</p>
    <p style="font-size:14px;line-height:1.6;color:#333;margin:0 0 12px">Keys, remotes, and fobs can be mailed or delivered to our office at:</p>
    <p style="font-size:14px;line-height:1.55;color:#333;margin:0 0 12px;padding-left:12px;border-left:3px solid #1FA864"><b>${BRAND_NAME}</b><br>520 3rd St #201<br>Oakland, CA 94607</p>
    <p style="font-size:14px;line-height:1.6;color:#333;margin:0">Or we can pick them up — just reply with a pickup day, time, and location and we'll coordinate.</p>
  </div>
  <div style="margin-top:14px;padding:14px 18px;background:#FBFDFB;border:1px dashed #CFE3D6;border-radius:10px">
    <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#166337;margin-bottom:4px">Smart Scan Sign — Coming Soon</div>
    <p style="font-size:13px;line-height:1.55;color:#4A4A4A;margin:0">Every property gets a Trash Scouts Smart Scan sign for their enclosure so residents can report issues directly. We're finalizing the supplier — details coming soon.</p>
  </div>`;

  const clientHtml = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff;color:#1A1A1A">
    <h1 style="font-size:22px;margin:0 0 12px;color:#0E3F27">Welcome aboard!</h1>
    <p style="font-size:15px;line-height:1.6;color:#333">Hi ${escapeHtml(clientName)},</p>
    ${thankYou}
    <ul style="font-size:14px;line-height:1.7;color:#444;padding-left:18px;margin:14px 0">
      ${detailsList}
    </ul>
    <p style="text-align:center;margin:26px 0 14px">
      <a href="${url}" style="display:inline-block;background:#0E3F27;color:#fff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:10px;font-size:15px">View signed agreement</a>
    </p>
    <p style="text-align:center;margin:0 0 26px">
      <a href="${welcomeUrl}" style="display:inline-block;background:#fff;color:#0E3F27;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px;font-size:14px;border:1px solid #0E3F27">Open your Welcome Aboard page →</a>
    </p>
    ${onboardingHtml}
    ${brandFooter()}
  </div>`;

  const opsHtml = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff;color:#1A1A1A">
    <h1 style="font-size:20px;margin:0 0 10px;color:#0E3F27">New signed service agreement</h1>
    <p style="font-size:14px;color:#333"><b>${escapeHtml(clientName)}</b> just signed.</p>
    <ul style="font-size:14px;line-height:1.7;color:#444;padding-left:18px">
      ${property ? `<li>Property: ${escapeHtml(property)}</li>` : ""}
      <li>Client email: ${escapeHtml(primaryClientEmail)}</li>
      <li>Signed by: ${escapeHtml(signerName)}${signerTitle ? `, ${escapeHtml(signerTitle)}` : ""}</li>
      <li>Service start date: ${escapeHtml(startStr)}</li>
    </ul>
    <p style="text-align:center;margin:24px 0">
      <a href="${url}" style="display:inline-block;background:#0E3F27;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:9px;font-size:14px">View signed copy</a>
    </p>
    ${brandFooter()}
  </div>`;

  // Dedupe client-side recipients + POCs against each other.
  const primaryLower = primaryClientEmail.trim().toLowerCase();
  const extras = Array.from(
    new Set(extraClientEmails.map((e) => e.trim()).filter(Boolean)),
  ).filter((e) => e.toLowerCase() !== primaryLower);
  const pocs = Array.from(
    new Set(pocEmails.map((e) => e.trim()).filter(Boolean)),
  ).filter(
    (e) =>
      e.toLowerCase() !== primaryLower &&
      !extras.some((x) => x.toLowerCase() === e.toLowerCase()),
  );

  const subject = property
    ? `Your signed ${BRAND_NAME} service agreement — ${property}`
    : `Your signed ${BRAND_NAME} service agreement`;

  const opsSubject = property
    ? `New signed agreement: ${clientName} (${property})`
    : `New signed agreement: ${clientName}`;

  const sends: Array<Promise<{ ok: boolean; skipped?: boolean }>> = [];
  // Client + additional client recipients get the full welcome
  // message (with onboarding notes + welcome link).
  for (const to of [primaryClientEmail, ...extras]) {
    sends.push(sendEmail({ to, subject, html: clientHtml }));
  }
  // POCs get the concise ops-style summary.
  for (const poc of pocs) {
    sends.push(sendEmail({ to: poc, subject: opsSubject, html: opsHtml }));
  }
  const results = await Promise.allSettled(sends);
  return summarize(results, sends.length);
}

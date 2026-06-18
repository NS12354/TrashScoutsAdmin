import { randomBytes } from "node:crypto";
import { BRAND_NAME } from "@/lib/brand";
import { escapeHtml, sendEmail } from "@/lib/email";
import { usd } from "@/lib/proposalData";

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

function brandFooter(): string {
  return `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#888;font-family:Arial,sans-serif">
    <div><b>${BRAND_NAME}</b> · Onsite Waste Services</div>
    <div>520 3rd St #201, Oakland, CA 94607 · (510) 788-0462 · <a href="https://www.trashscouts.com" style="color:#16633C">www.trashscouts.com</a></div>
  </div>`;
}

export async function sendProposalReadyEmail({
  to,
  clientName,
  monthlyPrice,
  token,
  preparedBy,
  message,
}: {
  to: string;
  clientName: string;
  monthlyPrice: number;
  token: string;
  preparedBy?: string | null;
  message?: string | null;
}) {
  const url = `${publicBaseUrl()}/proposals/${encodeURIComponent(token)}`;
  const intro = message?.trim()
    ? `<p style="font-size:15px;line-height:1.6;color:#333">${escapeHtml(message.trim()).replace(/\n/g, "<br>")}</p>`
    : "";
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;color:#1A1A1A">
    <h1 style="font-size:22px;margin:0 0 12px;color:#0E3F27">Your service proposal from ${BRAND_NAME}</h1>
    <p style="font-size:15px;line-height:1.6;color:#333">Hi ${escapeHtml(clientName)},</p>
    <p style="font-size:15px;line-height:1.6;color:#333">Your onsite waste service proposal is ready to review. The estimated monthly rate is <b>${usd(monthlyPrice)}/mo</b>.</p>
    ${intro}
    <p style="text-align:center;margin:28px 0">
      <a href="${url}" style="display:inline-block;background:#1FA864;color:#06281A;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:10px;font-size:15px">View proposal &amp; accept</a>
    </p>
    <p style="font-size:13px;line-height:1.55;color:#666">You can review the full scope, schedule, and rate at the link above, and accept the proposal online when you're ready.</p>
    ${preparedBy ? `<p style="font-size:13px;color:#666;margin-top:18px">Prepared by ${escapeHtml(preparedBy)}</p>` : ""}
    ${brandFooter()}
  </div>`;
  return sendEmail({
    to,
    subject: `Your ${BRAND_NAME} service proposal`,
    html,
  });
}

export async function sendSignedAgreementEmails({
  clientEmail,
  clientName,
  monthlyPrice,
  weeklyPrice,
  signerName,
  token,
  agreementId,
  thankYouMessage,
  pocEmails,
}: {
  clientEmail: string;
  clientName: string;
  monthlyPrice: number;
  weeklyPrice: number;
  signerName: string;
  token: string;
  agreementId: string;
  thankYouMessage?: string | null;
  // Internal points-of-contact set by the admin at proposal-send
  // time. They get a CC-style notification when the client signs.
  // Replaces the previous NOTIFICATION_EMAIL fallback — no longer
  // sends to any default ops inbox.
  pocEmails: string[];
}) {
  const url = `${publicBaseUrl()}/proposals/${encodeURIComponent(token)}/signed/${encodeURIComponent(agreementId)}`;

  // Admin-provided thank-you note replaces the canned "thanks + we'll
  // be in touch" copy when set. Plain text → linebreaks become <br>.
  const thankYou = thankYouMessage?.trim()
    ? `<p style="font-size:15px;line-height:1.6;color:#333">${escapeHtml(thankYouMessage.trim()).replace(/\n/g, "<br>")}</p>`
    : `<p style="font-size:15px;line-height:1.6;color:#333">Thanks for accepting your ${BRAND_NAME} service proposal. Your signed agreement is attached at the link below — open it and use <b>Save as PDF</b> in your browser to keep a copy.</p>`;

  const clientHtml = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;color:#1A1A1A">
    <h1 style="font-size:22px;margin:0 0 12px;color:#0E3F27">Your signed service agreement</h1>
    <p style="font-size:15px;line-height:1.6;color:#333">Hi ${escapeHtml(clientName)},</p>
    ${thankYou}
    <ul style="font-size:14px;line-height:1.7;color:#444;padding-left:18px;margin:14px 0">
      <li>Monthly service rate: <b>${usd(monthlyPrice)}/mo</b> (${usd(weeklyPrice)}/wk)</li>
      <li>Signed by: ${escapeHtml(signerName)}</li>
    </ul>
    <p style="text-align:center;margin:28px 0">
      <a href="${url}" style="display:inline-block;background:#0E3F27;color:#fff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:10px;font-size:15px">View signed agreement</a>
    </p>
    ${brandFooter()}
  </div>`;

  const opsHtml = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff;color:#1A1A1A">
    <h1 style="font-size:20px;margin:0 0 10px;color:#0E3F27">New signed service agreement</h1>
    <p style="font-size:14px;color:#333"><b>${escapeHtml(clientName)}</b> just signed.</p>
    <ul style="font-size:14px;line-height:1.7;color:#444;padding-left:18px">
      <li>Client email: ${escapeHtml(clientEmail)}</li>
      <li>Signed by: ${escapeHtml(signerName)}</li>
      <li>Monthly rate: ${usd(monthlyPrice)}/mo (${usd(weeklyPrice)}/wk)</li>
    </ul>
    <p style="text-align:center;margin:24px 0">
      <a href="${url}" style="display:inline-block;background:#0E3F27;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:9px;font-size:14px">View signed copy</a>
    </p>
    ${brandFooter()}
  </div>`;

  // Deduplicate against the client's own address — if the admin
  // accidentally lists the client as a POC, don't send them two copies.
  const clientLower = clientEmail.trim().toLowerCase();
  const cleanedPocs = Array.from(
    new Set(
      pocEmails
        .map((e) => e.trim())
        .filter((e) => e && e.toLowerCase() !== clientLower),
    ),
  );

  const sends: Array<Promise<{ ok: boolean; skipped?: boolean }>> = [
    sendEmail({
      to: clientEmail,
      subject: `Your signed ${BRAND_NAME} service agreement`,
      html: clientHtml,
    }),
  ];
  for (const poc of cleanedPocs) {
    sends.push(
      sendEmail({
        to: poc,
        subject: `New signed agreement: ${clientName}`,
        html: opsHtml,
      }),
    );
  }
  const results = await Promise.allSettled(sends);
  return {
    client:
      results[0]?.status === "fulfilled" ? results[0].value : { ok: false },
    poc: results.slice(1).map((r) =>
      r.status === "fulfilled" ? r.value : { ok: false },
    ),
  };
}

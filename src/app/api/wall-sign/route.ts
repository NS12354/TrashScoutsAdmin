import { NextRequest, NextResponse } from "next/server";
import { escapeHtml, sendEmail } from "@/lib/email";
import { BRAND_NAME } from "@/lib/brand";
import { rateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const MAX_NAME = 100;
const MAX_CONTACT = 200;
const MAX_NOTES = 1000;
const RATE_LIMIT = { limit: 5, windowMs: 5 * 60 * 1000 };

function getClientIp(req: NextRequest): string {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]?.trim() || "anon";
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "anon";
  return req.headers.get("x-real-ip") || "anon";
}

function sanitizeHeaderValue(s: string): string {
  return s.replace(/[\r\n\t\v\f]/g, "").trim();
}

function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimit(`wallsign:${ip}`, RATE_LIMIT);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `Too many requests — please wait ${limit.resetIn} seconds before submitting again.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.resetIn) } },
    );
  }

  const form = await req.formData();
  const propertyId = String(form.get("propertyId") ?? "").trim();
  const requesterName = String(form.get("requesterName") ?? "")
    .trim()
    .slice(0, MAX_NAME);
  const requesterContactRaw = String(form.get("requesterContact") ?? "").trim();
  const requesterContact = sanitizeHeaderValue(requesterContactRaw).slice(
    0,
    MAX_CONTACT,
  );
  const notes = String(form.get("notes") ?? "")
    .trim()
    .slice(0, MAX_NOTES);

  if (!propertyId) {
    return NextResponse.json({ error: "Missing property" }, { status: 400 });
  }
  if (!requesterName) {
    return NextResponse.json(
      { error: "Your name is required." },
      { status: 400 },
    );
  }
  if (!requesterContact || !looksLikeEmail(requesterContact)) {
    return NextResponse.json(
      { error: "Please enter a valid email so we can follow up." },
      { status: 400 },
    );
  }

  const property = await prisma.property.findFirst({
    where: { OR: [{ slug: propertyId }, { id: propertyId }] },
    select: { name: true, address: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Unknown property" }, { status: 404 });
  }

  const opsEmail = process.env.NOTIFICATION_EMAIL;
  if (opsEmail) {
    const subject = `[${BRAND_NAME}] Wall Sign request — ${property.name}`;
    const body = `
      <p style="margin:0 0 12px;color:#3f3f46">
        A resident has requested a Trash Scouts Enclosure Wall Sign at
        <strong>${escapeHtml(property.name)}</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:6px 0;color:#71717a;width:130px">Property</td><td>${escapeHtml(property.name)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a">Address</td><td>${escapeHtml(property.address)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a">Requester</td><td>${escapeHtml(requesterName)} · ${escapeHtml(requesterContact)}</td></tr>
        ${notes ? `<tr><td style="padding:6px 0;color:#71717a;vertical-align:top">Notes</td><td>${escapeHtml(notes)}</td></tr>` : ""}
      </table>
    `;
    const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;background:#f5f5f4;margin:0;padding:24px;color:#18181b">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7">
    <tr><td style="padding:20px 24px;border-bottom:1px solid #f1f1f0">
      <div style="font-weight:700;letter-spacing:0.18em;color:#16a34a">${escapeHtml(BRAND_NAME.toUpperCase())}</div>
    </td></tr>
    <tr><td style="padding:20px 24px">
      <h1 style="font-size:18px;margin:0 0 12px">New Wall Sign request</h1>
      ${body}
    </td></tr>
  </table>
</body></html>`;
    const text = `New Wall Sign request at ${property.name} (${property.address}).\n\nRequester: ${requesterName} · ${requesterContact}${notes ? `\n\nNotes: ${notes}` : ""}`;

    const result = await sendEmail({
      to: opsEmail,
      subject,
      html,
      text,
      replyTo: requesterContact,
    });
    if (!result.ok) {
      console.error("[wall-sign] ops email failed:", result.error);
    }
  }

  return NextResponse.json({ ok: true });
}

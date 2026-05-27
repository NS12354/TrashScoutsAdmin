import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { escapeHtml, sendEmail } from "@/lib/email";
import { issueCategoryLabel } from "@/lib/format";
import { BRAND_NAME } from "@/lib/brand";

export const runtime = "nodejs";

const VALID_STATUSES = new Set(["OPEN", "IN_PROGRESS", "RESOLVED"]);

// Reports can only be moved between statuses (Open / In progress / Resolved).
// There is intentionally no DELETE — reports and their photos are kept in
// the database as a permanent record.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { status } = await req.json();
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Load current state first so we can detect the transition INTO resolved
  // and grab the reporter's contact for the confirmation email.
  const existing = await prisma.issue.findUnique({
    where: { id },
    select: {
      status: true,
      category: true,
      reporterName: true,
      reporterContact: true,
      property: { select: { name: true } },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.issue.update({ where: { id }, data: { status } });

  // Tell the reporter once, only when the report first becomes resolved and
  // they left a valid email. Best-effort: the status change is already saved,
  // so a flaky/over-quota email never blocks the update or loses the change.
  const newlyResolved = status === "RESOLVED" && existing.status !== "RESOLVED";
  if (newlyResolved && looksLikeEmail(existing.reporterContact)) {
    const mail = renderResidentResolved({
      propertyName: existing.property.name,
      category: existing.category,
      reporterName: existing.reporterName,
    });
    const result = await sendEmail({
      to: existing.reporterContact!,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    if (!result.ok) {
      console.error(
        "[admin/issues] resolved email failed (status saved):",
        result.error,
      );
    }
  }

  return NextResponse.json({ ok: true });
}

function looksLikeEmail(s: string | null): boolean {
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function renderResidentResolved(args: {
  propertyName: string;
  category: string;
  reporterName: string | null;
}) {
  const greeting = args.reporterName ? `Hi ${args.reporterName},` : "Hi,";
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;background:#f5f5f4;margin:0;padding:24px;color:#18181b">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7">
    <tr><td style="padding:20px 24px;border-bottom:1px solid #f1f1f0">
      <div style="font-weight:700;letter-spacing:0.18em;color:#16a34a">${escapeHtml(BRAND_NAME.toUpperCase())}</div>
    </td></tr>
    <tr><td style="padding:20px 24px">
      <h1 style="font-size:18px;margin:0 0 12px">Your report has been resolved</h1>
      <p style="margin:0 0 12px;color:#3f3f46;line-height:1.5">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 12px;color:#3f3f46;line-height:1.5">
        Good news — the <strong>${escapeHtml(issueCategoryLabel(args.category))}</strong>
        issue you reported at <strong>${escapeHtml(args.propertyName)}</strong> has been
        resolved. Thanks for helping keep things running smoothly.
      </p>
      <p style="margin:0;color:#3f3f46;line-height:1.5">
        If the problem isn't fully fixed, just scan the QR code in your trash
        room and submit a new report.
      </p>
    </td></tr>
  </table>
</body></html>`;
  const text = `${greeting}

Good news — the ${issueCategoryLabel(args.category)} issue you reported at ${args.propertyName} has been resolved. Thanks for helping keep things running smoothly.

If the problem isn't fully fixed, just scan the QR code in your trash room and submit a new report.

— ${BRAND_NAME}`;
  return {
    subject: `Your ${BRAND_NAME} report has been resolved — ${args.propertyName}`,
    html,
    text,
  };
}

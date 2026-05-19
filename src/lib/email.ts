import { Resend } from "resend";
import { BRAND_NAME } from "./brand";

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || `${BRAND_NAME} <onboarding@resend.dev>`;

const client = apiKey ? new Resend(apiKey) : null;

export type EmailAttachment = {
  filename: string;
  content: Buffer;
};

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

// Sends an email via Resend. With no RESEND_API_KEY, logs the message and
// returns a successful no-op so dev doesn't break and a missing secret in
// prod doesn't crash a request path.
export async function sendEmail(input: SendEmailInput): Promise<{
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}> {
  if (!client) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[email] RESEND_API_KEY not set — skipping send.",
        JSON.stringify({ to: input.to, subject: input.subject }),
      );
    }
    return { ok: true, skipped: true };
  }

  try {
    const result = await client.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });
    if (result.error) {
      console.error("[email] Resend rejected send:", result.error.message, {
        to: input.to,
        subject: input.subject,
      });
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "send failed";
    console.error("[email] Send threw:", message, { to: input.to });
    return { ok: false, error: message };
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Sends the invite or password-reset email. Both link to /admin/set-password
// — same template, different subject + intro copy.
export async function sendPasswordEmail(args: {
  to: string;
  name: string;
  link: string;
  purpose: "invite" | "reset";
  expiresAt: Date;
}) {
  const isInvite = args.purpose === "invite";
  const subject = isInvite
    ? `You've been added as a ${BRAND_NAME} admin — set your password`
    : `${BRAND_NAME}: reset your password`;
  const heading = isInvite ? "Welcome aboard" : "Reset your password";
  const lead = isInvite
    ? `<strong>${escapeHtml(args.name)}</strong>, another admin added you to the ${escapeHtml(BRAND_NAME)} dashboard. Click below to choose a password and finish setting up your account.`
    : `<strong>${escapeHtml(args.name)}</strong>, click below to choose a new password for your ${escapeHtml(BRAND_NAME)} admin account. If you didn't request this, you can ignore this email.`;
  const buttonLabel = isInvite ? "Set your password" : "Reset password";
  const expiryNote = `This link expires on ${args.expiresAt.toLocaleString()}. If it expires, ask another admin to resend the invite or use Forgot password on the login page.`;

  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;background:#f5f5f4;margin:0;padding:24px;color:#18181b">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7">
    <tr><td style="padding:20px 24px;border-bottom:1px solid #f1f1f0">
      <div style="font-weight:700;letter-spacing:0.18em;color:#16a34a">${escapeHtml(BRAND_NAME.toUpperCase())}</div>
    </td></tr>
    <tr><td style="padding:20px 24px">
      <h1 style="font-size:18px;margin:0 0 12px">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 16px;color:#3f3f46;line-height:1.5">${lead}</p>
      <p style="margin:0 0 16px;text-align:center">
        <a href="${args.link}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(buttonLabel)}</a>
      </p>
      <p style="margin:0 0 8px;color:#71717a;font-size:13px">Or paste this link into your browser:</p>
      <p style="margin:0 0 16px;color:#3f3f46;font-size:13px;word-break:break-all"><a href="${args.link}" style="color:#16a34a;text-decoration:none">${escapeHtml(args.link)}</a></p>
      <p style="margin:0;color:#71717a;font-size:12px">${escapeHtml(expiryNote)}</p>
    </td></tr>
  </table>
</body></html>`;

  const text = `${heading}

${args.name}, ${
    isInvite
      ? `another admin added you to the ${BRAND_NAME} dashboard.`
      : `you requested a password reset for ${BRAND_NAME}.`
  }

${isInvite ? "Set your password" : "Reset your password"}: ${args.link}

${expiryNote}`;

  return sendEmail({ to: args.to, subject, html, text });
}

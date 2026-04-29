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

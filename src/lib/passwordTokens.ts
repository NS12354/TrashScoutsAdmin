// Helpers for invite + password-reset tokens. The raw token is the bearer
// secret in the email link; we never store it — only its sha256 hash. Lookup
// hashes the incoming token and matches by `tokenHash`, then checks expiry
// and single-use status.

import { createHash, randomBytes } from "crypto";
import { prisma } from "./db";

export type TokenPurpose = "invite" | "reset";

// Days each kind of token stays valid. Invites are longer because the new
// admin may not be at their inbox immediately.
const TTL_DAYS: Record<TokenPurpose, number> = {
  invite: 7,
  reset: 1,
};

export type IssuedToken = {
  raw: string; // include in the email link, do NOT store
  expiresAt: Date;
};

export async function issueToken(
  userId: string,
  purpose: TokenPurpose,
): Promise<IssuedToken> {
  const raw = randomBytes(32).toString("base64url");
  const tokenHash = sha256(raw);
  const expiresAt = new Date(
    Date.now() + TTL_DAYS[purpose] * 24 * 60 * 60 * 1000,
  );

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, purpose, expiresAt },
  });

  return { raw, expiresAt };
}

// Look up a token by its raw value. Returns the row (with userId) only if
// it's a valid live token: hash matches, not expired, not previously used.
export async function findActiveToken(rawToken: string) {
  if (!rawToken) return null;
  const tokenHash = sha256(rawToken);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!row) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row;
}

export async function consumeToken(tokenId: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  });
}

// Invalidate any outstanding tokens for a user (e.g. when a fresh invite is
// resent, the old link should stop working).
export async function invalidateActiveTokens(
  userId: string,
  purpose?: TokenPurpose,
): Promise<void> {
  await prisma.passwordResetToken.updateMany({
    where: {
      userId,
      usedAt: null,
      ...(purpose ? { purpose } : {}),
    },
    data: { usedAt: new Date() },
  });
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

// Bootstrap CLI to create the first admin (or any admin) directly from the
// command line. Auth-gated UIs can't be used until at least one admin exists,
// so this is the chicken-and-egg escape hatch.
//
// Usage:
//   npm run admin:create -- <email> "<name>" <password>
//
// Example:
//   npm run admin:create -- chris@trashscouts.com "Chris" hunter2

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, name, password] = process.argv.slice(2);

  if (!email || !name || !password) {
    console.error(
      'Usage: npm run admin:create -- <email> "<name>" <password>',
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Email looks invalid.");
    process.exit(1);
  }

  const normalized = email.toLowerCase();
  const hash = await bcrypt.hash(password, 10);

  // CLI-created admins skip the email-invite flow — passwordSetAt is stamped
  // immediately so the account can log in right away.
  const now = new Date();
  const user = await prisma.user.upsert({
    where: { email: normalized },
    update: { name, password: hash, passwordSetAt: now },
    create: { email: normalized, name, password: hash, passwordSetAt: now },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  console.log(
    `✓ Admin ready: ${user.email} (${user.name}) — id ${user.id}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

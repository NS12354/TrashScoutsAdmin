// Minimal layout for public-facing proposal/agreement pages. No admin
// chrome, no auth gating — these pages are reached via a tokenized
// link and rely on the token's entropy for access control.

export default function ProposalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

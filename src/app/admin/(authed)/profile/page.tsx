import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireSession();
  // Read the canonical row so a stale JWT (e.g. after a rename in another
  // browser) doesn't show outdated values on this page.
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  if (!user) {
    // Session is valid but the user was deleted — very unlikely but treat
    // it as a logout state by surfacing a minimal message.
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Your account is no longer active. Sign out and ask another admin to
          re-invite you.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Your account details and password. Changes apply to{" "}
        <strong>{user.email}</strong>.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProfileForm initialName={user.name} email={user.email} />
        <ChangePasswordForm />
      </div>
    </div>
  );
}

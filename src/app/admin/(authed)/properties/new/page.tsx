import Link from "next/link";
import { PropertyWizard } from "@/components/admin/PropertyWizard";

export default function NewPropertyPage() {
  return (
    <div>
      <Link
        href="/admin"
        className="text-sm text-zinc-500 hover:underline"
      >
        ← All properties
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Add a property
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Fill in the building details. Clicking <strong>Generate QR Code</strong>{" "}
        saves everything and gives you a printable QR.
      </p>
      <div className="mt-6">
        <PropertyWizard mode="new" />
      </div>
    </div>
  );
}

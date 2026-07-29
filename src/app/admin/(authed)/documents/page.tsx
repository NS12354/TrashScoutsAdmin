import { prisma } from "@/lib/db";
import { DocumentLibrary } from "@/components/admin/DocumentLibrary";
import { DocumentUploadForm } from "@/components/admin/DocumentUploadForm";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: [{ title: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      filename: true,
      size: true,
      uploadedByName: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
      <p className="mt-1 text-sm text-zinc-500">
        SOPs, forms and training material. Anyone with an admin login can
        upload here and download what the team has shared.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <DocumentLibrary
          documents={documents.map((d) => ({
            ...d,
            // Dates cross the server/client boundary as ISO strings so the
            // row component can format them in the viewer's locale.
            createdAt: d.createdAt.toISOString(),
          }))}
        />
        <DocumentUploadForm />
      </div>
    </div>
  );
}

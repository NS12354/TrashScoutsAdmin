import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB raw

export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const subdir = (form.get("subdir") as string) || "admin";

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Must be an image" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File must be under 12 MB" },
      { status: 400 },
    );
  }

  const url = await saveUploadedFile(file, subdir);
  return NextResponse.json({ url });
}

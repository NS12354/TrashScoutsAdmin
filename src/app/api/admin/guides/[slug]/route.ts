import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED_SLUGS = new Set(["waste", "hhw"]);

const MAX_TITLE_LEN = 120;
const MAX_CONTENT_LEN = 20_000;

type UpdateBody = {
  title?: string;
  content?: string;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  if (!ALLOWED_SLUGS.has(slug)) {
    return NextResponse.json({ error: "Unknown guide" }, { status: 404 });
  }

  const body = (await req.json()) as UpdateBody;

  const data: Record<string, string> = {};
  if ("title" in body) {
    const t = body.title?.trim();
    if (!t) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (t.length > MAX_TITLE_LEN) {
      return NextResponse.json(
        { error: `Title must be ${MAX_TITLE_LEN} characters or fewer` },
        { status: 400 },
      );
    }
    data.title = t;
  }
  if ("content" in body) {
    const c = body.content ?? "";
    if (c.length > MAX_CONTENT_LEN) {
      return NextResponse.json(
        { error: `Content must be ${MAX_CONTENT_LEN} characters or fewer` },
        { status: 400 },
      );
    }
    data.content = c;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const guide = await prisma.guide.update({
    where: { slug },
    data,
    select: { slug: true, title: true, content: true, updatedAt: true },
  });
  return NextResponse.json({ guide });
}

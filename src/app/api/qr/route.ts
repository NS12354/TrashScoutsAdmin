import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "/";
  const size = Math.max(64, Math.min(1024, Number(searchParams.get("size") ?? 400)));
  const download = searchParams.get("download") === "1";

  const origin = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const target = origin + path;

  const png = await QRCode.toBuffer(target, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  const headers: Record<string, string> = {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=300",
  };
  if (download) {
    const safePath = path.replace(/[^a-z0-9-]+/gi, "_");
    headers["Content-Disposition"] = `attachment; filename="qr${safePath}.png"`;
  }

  return new NextResponse(new Uint8Array(png), { headers });
}

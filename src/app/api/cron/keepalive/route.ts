import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Supabase free tier auto-pauses a project after 7 days of zero
// database activity. Vercel Cron pings this endpoint twice a week
// (Sun + Wed) and we issue a trivial SELECT — that counts as
// activity and resets the inactivity timer. No data is written, so
// the heartbeat leaves no trace beyond Postgres connection logs.
//
// Authentication: Vercel automatically injects an Authorization
// header `Bearer <CRON_SECRET>` on cron invocations when the
// CRON_SECRET env var is set on the project. If unset (e.g. local
// dev), we allow the call so developers can hit the URL manually.

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Trivial round-trip — proves the connection works and counts
    // against the auto-pause timer.
    const result = (await prisma.$queryRaw`SELECT 1 as ok`) as Array<{
      ok: number;
    }>;
    return NextResponse.json({
      ok: result[0]?.ok === 1,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Heartbeat failed",
      },
      { status: 500 },
    );
  }
}

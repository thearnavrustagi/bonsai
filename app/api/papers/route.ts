import { NextRequest, NextResponse } from "next/server";
import { getPapersForDate, getAvailableDates, getDayMeta } from "@/lib/storage";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/papers");

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayDate();
  const req = log.request("GET", "/api/papers", { date });

  const [papers, availableDates, meta] = await Promise.all([
    getPapersForDate(date),
    getAvailableDates(),
    getDayMeta(date),
  ]);

  req.done(200, { papers: papers.length, dates: availableDates.length });
  return NextResponse.json({
    date,
    papers,
    availableDates,
    fetchedAt: meta?.fetchedAt ?? null,
  });
}

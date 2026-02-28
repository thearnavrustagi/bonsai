import { NextRequest, NextResponse } from "next/server";
import { findPaperById } from "@/lib/storage";
import { importPaper } from "@/lib/import";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/papers/[id]");

export const maxDuration = 120;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const req = log.request("GET", `/api/papers/${id}`);

  const result = await findPaperById(id);

  if (result) {
    req.done(200, { date: result.date });
    return NextResponse.json(result);
  }

  log.info("Paper not in storage, importing on-demand", { id });

  try {
    const summary = await importPaper(id);
    const date = new Date().toISOString().split("T")[0];
    req.done(200, { date, imported: true });
    return NextResponse.json({ paper: summary, date });
  } catch (err) {
    log.error("On-demand import failed", {
      id,
      error: err instanceof Error ? err.message : String(err),
    });
    req.done(500);
    return NextResponse.json(
      { error: "Failed to import paper", details: String(err) },
      { status: 500 }
    );
  }
}

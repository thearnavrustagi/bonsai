import { NextRequest, NextResponse } from "next/server";
import { batchImportPapers } from "@/lib/import";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/warm-papers");

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const req = log.request("POST", "/api/warm-papers");

  try {
    const { paperIds } = (await request.json()) as { paperIds: string[] };

    if (!Array.isArray(paperIds) || paperIds.length === 0) {
      req.done(400);
      return NextResponse.json(
        { error: "paperIds must be a non-empty array" },
        { status: 400 }
      );
    }

    const result = await batchImportPapers(paperIds, 3);

    req.done(200, {
      warmed: result.warmed.length,
      failed: result.failed.length,
      skipped: result.skipped.length,
    });
    return NextResponse.json(result);
  } catch (err) {
    req.fail(500, err);
    return NextResponse.json(
      { error: "Warm pipeline failed", details: String(err) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { importPaper } from "@/lib/import";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/import-paper");

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const { paperId } = (await request.json()) as { paperId: string };
  const req = log.request("POST", "/api/import-paper", { paperId });

  if (!paperId) {
    req.done(400, { error: "Missing paperId" });
    return NextResponse.json({ error: "paperId is required" }, { status: 400 });
  }

  try {
    const summary = await importPaper(paperId);
    log.info("Imported paper", { id: paperId });
    req.done(200, { imported: paperId });
    return NextResponse.json({
      message: `Imported "${summary.title}"`,
      paperId: summary.id,
    });
  } catch (err) {
    req.fail(500, err);
    return NextResponse.json(
      { error: "Import failed", details: String(err) },
      { status: 500 }
    );
  }
}

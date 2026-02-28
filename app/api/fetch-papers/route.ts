import { NextRequest, NextResponse } from "next/server";
import { fetchDailyPapers, downloadPdf, deletePdf } from "@/lib/huggingface";
import { summarizePaper } from "@/lib/gemini";
import { savePaper, saveDayMeta, dayExists } from "@/lib/storage";
import { createLogger } from "@/lib/logger";
import type { DayMeta } from "@/lib/types";

const log = createLogger("api/fetch-papers");

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";
  const date = todayDate();
  const req = log.request("POST", "/api/fetch-papers", { date, force });

  try {
    if (!force && (await dayExists(date))) {
      req.done(200, { skipped: true });
      return NextResponse.json(
        { message: "Papers already fetched for today", date },
        { status: 200 }
      );
    }

    const papers = await fetchDailyPapers(5);
    log.info(`Fetched ${papers.length} papers from HuggingFace`);
    const paperIds: string[] = [];

    for (const paper of papers) {
      let pdfPath: string | null = null;
      try {
        log.info(`Processing paper`, { id: paper.id });
        pdfPath = await downloadPdf(paper.pdfUrl, paper.id);
        const summary = await summarizePaper(pdfPath, paper);
        await savePaper(date, summary);
        paperIds.push(paper.id);
        log.info(`Summarized paper`, { id: paper.id });
      } catch (err) {
        log.error(`Failed to process paper`, {
          id: paper.id,
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        if (pdfPath) await deletePdf(pdfPath);
      }
    }

    const meta: DayMeta = {
      date,
      paperIds,
      fetchedAt: new Date().toISOString(),
    };
    await saveDayMeta(meta);

    req.done(200, { processed: paperIds.length, total: papers.length });
    return NextResponse.json({
      message: `Fetched and summarized ${paperIds.length} papers`,
      date,
      paperIds,
    });
  } catch (err) {
    req.fail(500, err);
    return NextResponse.json(
      { error: "Pipeline failed", details: String(err) },
      { status: 500 }
    );
  }
}

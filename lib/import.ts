import axios from "axios";
import { downloadPdf, deletePdf } from "@/lib/huggingface";
import { summarizePaper } from "@/lib/gemini";
import { savePaper, saveDayMeta, getDayMeta, findPaperById } from "@/lib/storage";
import { createLogger } from "@/lib/logger";
import type { FetchedPaper } from "@/lib/huggingface";
import type { PaperSummary, DayMeta } from "@/lib/types";

export interface BatchImportResult {
  warmed: string[];
  failed: string[];
  skipped: string[];
}

const log = createLogger("lib/import");
const HF_DAILY_PAPERS_URL = "https://huggingface.co/api/daily_papers";

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

async function resolvePaperInfo(paperId: string): Promise<FetchedPaper | null> {
  try {
    const { data } = await axios.get<
      Array<{
        paper: {
          id: string;
          title: string;
          authors: { name: string }[];
          publishedAt: string;
          mediaUrls?: string[];
        };
        title: string;
        numUpvotes: number;
        mediaUrls?: string[];
        thumbnail?: string;
      }>
    >(HF_DAILY_PAPERS_URL);

    const hfPaper = data.find((item) => item.paper.id === paperId);
    if (hfPaper) {
      return {
        id: hfPaper.paper.id,
        title: hfPaper.title || hfPaper.paper.title,
        authors: hfPaper.paper.authors.map((a) => a.name),
        arxivUrl: `https://arxiv.org/abs/${hfPaper.paper.id}`,
        pdfUrl: `https://arxiv.org/pdf/${hfPaper.paper.id}`,
        upvotes: hfPaper.numUpvotes ?? 0,
        publishedAt: hfPaper.paper.publishedAt,
        mediaUrls: hfPaper.mediaUrls || hfPaper.paper.mediaUrls || [],
        thumbnail: hfPaper.thumbnail,
      };
    }
  } catch {
    // HuggingFace lookup failed
  }

  try {
    const idUrl = `http://export.arxiv.org/api/query?id_list=${paperId}&max_results=1`;
    const { data: xmlData } = await axios.get<string>(idUrl, {
      timeout: 10000,
      responseType: "text",
    });
    const titleMatch = xmlData.match(
      /<entry>[\s\S]*?<title>([\s\S]*?)<\/title>/
    );
    const authorMatches = [
      ...xmlData.matchAll(/<author>\s*<name>([^<]+)<\/name>/g),
    ];

    if (titleMatch) {
      return {
        id: paperId,
        title: titleMatch[1].replace(/\s+/g, " ").trim(),
        authors: authorMatches.map((m) => m[1].trim()),
        arxivUrl: `https://arxiv.org/abs/${paperId}`,
        pdfUrl: `https://arxiv.org/pdf/${paperId}`,
        upvotes: 0,
        publishedAt: new Date().toISOString(),
        mediaUrls: [],
      };
    }
  } catch {
    // arXiv lookup also failed
  }

  return null;
}

/**
 * Import a paper by ID: resolve metadata, download PDF, summarize via Gemini,
 * and persist to storage. Returns cached version if already imported.
 */
export async function importPaper(paperId: string): Promise<PaperSummary> {
  const existing = await findPaperById(paperId);
  if (existing) {
    log.info("Paper already in DB, skipping import", { id: paperId });
    return existing.paper;
  }

  const date = todayDate();

  let paperInfo = await resolvePaperInfo(paperId);

  if (!paperInfo) {
    paperInfo = {
      id: paperId,
      title: paperId,
      authors: [],
      arxivUrl: `https://arxiv.org/abs/${paperId}`,
      pdfUrl: `https://arxiv.org/pdf/${paperId}`,
      upvotes: 0,
      publishedAt: new Date().toISOString(),
      mediaUrls: [],
    };
  }

  let pdfPath: string | null = null;
  try {
    log.info("Downloading PDF", { id: paperId });
    pdfPath = await downloadPdf(paperInfo.pdfUrl, paperInfo.id);

    log.info("Summarizing paper", { id: paperId });
    const summary = await summarizePaper(pdfPath, paperInfo);
    await savePaper(date, summary);

    const existingMeta = await getDayMeta(date);
    const paperIds = existingMeta
      ? [...new Set([...existingMeta.paperIds, paperInfo.id])]
      : [paperInfo.id];

    const meta: DayMeta = { date, paperIds, fetchedAt: new Date().toISOString() };
    await saveDayMeta(meta);

    log.info("Imported paper", { id: paperId });
    return summary;
  } finally {
    if (pdfPath) await deletePdf(pdfPath);
  }
}

/**
 * Batch-import multiple papers with a concurrency limit.
 * Skips papers already in storage.
 */
export async function batchImportPapers(
  paperIds: string[],
  concurrency = 3
): Promise<BatchImportResult> {
  const result: BatchImportResult = { warmed: [], failed: [], skipped: [] };

  const toImport: string[] = [];
  for (const id of paperIds) {
    const existing = await findPaperById(id);
    if (existing) {
      result.skipped.push(id);
    } else {
      toImport.push(id);
    }
  }

  if (toImport.length === 0) {
    log.info("All papers already cached", { skipped: result.skipped.length });
    return result;
  }

  log.info("Batch importing papers", {
    total: toImport.length,
    concurrency,
  });

  for (let i = 0; i < toImport.length; i += concurrency) {
    const chunk = toImport.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      chunk.map((id) => importPaper(id))
    );

    for (let j = 0; j < settled.length; j++) {
      const outcome = settled[j];
      const id = chunk[j];
      if (outcome.status === "fulfilled") {
        result.warmed.push(id);
      } else {
        log.error("Batch import failed for paper", {
          id,
          error: outcome.reason instanceof Error
            ? outcome.reason.message
            : String(outcome.reason),
        });
        result.failed.push(id);
      }
    }
  }

  log.info("Batch import complete", {
    warmed: result.warmed.length,
    failed: result.failed.length,
    skipped: result.skipped.length,
  });

  return result;
}

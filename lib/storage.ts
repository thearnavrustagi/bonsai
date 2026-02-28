import { neon } from "@neondatabase/serverless";
import type { PaperSummary, DayMeta } from "./types";

const sql = neon(process.env.DATABASE_URL!);

export async function dayExists(date: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM day_meta WHERE date = ${date} LIMIT 1`;
  return rows.length > 0;
}

export async function savePaper(
  date: string,
  paper: PaperSummary
): Promise<void> {
  await sql`
    INSERT INTO papers (id, date, title, authors, arxiv_url, pdf_url, summary,
      technical_details, key_findings, diagrams, mermaid_diagrams, tldr,
      upvotes, published_at, fetched_at, media_urls, thumbnail)
    VALUES (
      ${paper.id}, ${date}, ${paper.title}, ${paper.authors},
      ${paper.arxivUrl}, ${paper.pdfUrl}, ${paper.summary},
      ${paper.technicalDetails}, ${paper.keyFindings},
      ${JSON.stringify(paper.diagrams)}, ${JSON.stringify(paper.mermaidDiagrams ?? [])},
      ${paper.tldr}, ${paper.upvotes}, ${paper.publishedAt},
      ${paper.fetchedAt}, ${paper.mediaUrls}, ${paper.thumbnail ?? null}
    )
    ON CONFLICT (id, date) DO UPDATE SET
      title = EXCLUDED.title,
      authors = EXCLUDED.authors,
      arxiv_url = EXCLUDED.arxiv_url,
      pdf_url = EXCLUDED.pdf_url,
      summary = EXCLUDED.summary,
      technical_details = EXCLUDED.technical_details,
      key_findings = EXCLUDED.key_findings,
      diagrams = EXCLUDED.diagrams,
      mermaid_diagrams = EXCLUDED.mermaid_diagrams,
      tldr = EXCLUDED.tldr,
      upvotes = EXCLUDED.upvotes,
      published_at = EXCLUDED.published_at,
      fetched_at = EXCLUDED.fetched_at,
      media_urls = EXCLUDED.media_urls,
      thumbnail = EXCLUDED.thumbnail
  `;
}

export async function saveDayMeta(meta: DayMeta): Promise<void> {
  await sql`
    INSERT INTO day_meta (date, paper_ids, fetched_at)
    VALUES (${meta.date}, ${meta.paperIds}, ${meta.fetchedAt})
    ON CONFLICT (date) DO UPDATE SET
      paper_ids = EXCLUDED.paper_ids,
      fetched_at = EXCLUDED.fetched_at
  `;
}

export async function getDayMeta(date: string): Promise<DayMeta | null> {
  const rows = await sql`SELECT date, paper_ids, fetched_at FROM day_meta WHERE date = ${date}`;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    date: row.date,
    paperIds: row.paper_ids,
    fetchedAt: row.fetched_at,
  };
}

function rowToPaper(row: Record<string, unknown>): PaperSummary {
  return {
    id: row.id as string,
    title: row.title as string,
    authors: row.authors as string[],
    arxivUrl: row.arxiv_url as string,
    pdfUrl: row.pdf_url as string,
    summary: row.summary as string,
    technicalDetails: row.technical_details as string,
    keyFindings: row.key_findings as string[],
    diagrams: row.diagrams as PaperSummary["diagrams"],
    mermaidDiagrams: row.mermaid_diagrams as PaperSummary["mermaidDiagrams"],
    tldr: row.tldr as string,
    upvotes: row.upvotes as number,
    publishedAt: row.published_at as string,
    fetchedAt: row.fetched_at as string,
    mediaUrls: row.media_urls as string[],
    thumbnail: (row.thumbnail as string) ?? undefined,
  };
}

export async function getPaper(
  date: string,
  paperId: string
): Promise<PaperSummary | null> {
  const rows = await sql`SELECT * FROM papers WHERE id = ${paperId} AND date = ${date} LIMIT 1`;
  if (rows.length === 0) return null;
  return rowToPaper(rows[0]);
}

export async function getPapersForDate(
  date: string
): Promise<PaperSummary[]> {
  const rows = await sql`SELECT * FROM papers WHERE date = ${date}`;
  return rows.map(rowToPaper);
}

export async function getAvailableDates(): Promise<string[]> {
  const rows = await sql`SELECT date FROM day_meta ORDER BY date DESC`;
  return rows.map((r) => r.date as string);
}

export async function findPaperById(
  paperId: string
): Promise<{ paper: PaperSummary; date: string } | null> {
  const rows = await sql`SELECT * FROM papers WHERE id = ${paperId} ORDER BY date DESC LIMIT 1`;
  if (rows.length === 0) return null;
  return { paper: rowToPaper(rows[0]), date: rows[0].date as string };
}

// ── Cache layer with 7am IST invalidation ──

export function getCurrentISTDate(): string {
  const now = new Date();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + IST_OFFSET_MS);
  const istHours = istTime.getUTCHours();
  if (istHours < 7) {
    istTime.setUTCDate(istTime.getUTCDate() - 1);
  }
  return istTime.toISOString().split("T")[0];
}

export async function getCached<T>(key: string): Promise<T | null> {
  const rows = await sql`SELECT cache_date, data FROM cache WHERE key = ${key} LIMIT 1`;
  if (rows.length === 0) return null;
  const row = rows[0];
  if (row.cache_date === getCurrentISTDate()) {
    return row.data as T;
  }
  return null;
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  await sql`
    INSERT INTO cache (key, cache_date, data)
    VALUES (${key}, ${getCurrentISTDate()}, ${JSON.stringify(data)})
    ON CONFLICT (key) DO UPDATE SET
      cache_date = EXCLUDED.cache_date,
      data = EXCLUDED.data
  `;
}

import axios from "axios";
import fs from "fs/promises";
import path from "path";
import os from "os";

const HF_DAILY_PAPERS_URL = "https://huggingface.co/api/daily_papers";

interface HFPaper {
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
}

export interface FetchedPaper {
  id: string;
  title: string;
  authors: string[];
  arxivUrl: string;
  pdfUrl: string;
  upvotes: number;
  publishedAt: string;
  mediaUrls: string[];
  thumbnail?: string;
}

export async function fetchDailyPapers(limit = 10): Promise<FetchedPaper[]> {
  let data: HFPaper[] = [];

  for (let daysBack = 0; daysBack < 7; daysBack++) {
    const date = new Date(Date.now() - daysBack * 86400000).toISOString().split("T")[0];
    console.log(`[huggingface] Trying date=${date} (daysBack=${daysBack})`);
    const res = await axios.get<HFPaper[]>(HF_DAILY_PAPERS_URL, {
      params: { date },
      timeout: 10000,
    });
    console.log(`[huggingface] API returned ${res.data.length} papers for ${date}`);
    if (res.data.length > 0) {
      data = res.data;
      break;
    }
  }

  const sorted = data
    .sort((a, b) => b.numUpvotes - a.numUpvotes)
    .slice(0, limit);

  return sorted.map((item) => ({
    id: item.paper.id,
    title: item.title || item.paper.title,
    authors: item.paper.authors.map((a) => a.name),
    arxivUrl: `https://arxiv.org/abs/${item.paper.id}`,
    pdfUrl: `https://arxiv.org/pdf/${item.paper.id}`,
    upvotes: item.numUpvotes ?? 0,
    publishedAt: item.paper.publishedAt,
    mediaUrls: item.mediaUrls || item.paper.mediaUrls || [],
    thumbnail: item.thumbnail,
  }));
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

async function fetchForDate(date: string): Promise<HFPaper[]> {
  try {
    const { data } = await axios.get<HFPaper[]>(HF_DAILY_PAPERS_URL, {
      params: { date },
      timeout: 10000,
    });
    return data;
  } catch {
    return [];
  }
}

export async function fetchDailyPaperTitles(
  limit: number,
  dateRange: "day" | "week" | "month"
): Promise<string[]> {
  const days = dateRange === "day" ? 1 : dateRange === "week" ? 7 : 30;
  const dates = Array.from({ length: days }, (_, i) => dateNDaysAgo(i));

  const results = await Promise.all(dates.map(fetchForDate));
  const seen = new Set<string>();
  const titles: string[] = [];

  for (const batch of results) {
    for (const item of batch) {
      if (!seen.has(item.paper.id)) {
        seen.add(item.paper.id);
        titles.push(item.title || item.paper.title);
        if (titles.length >= limit) return titles;
      }
    }
  }

  return titles;
}

export async function fetchDailyPaperItems(
  limit: number,
  dateRange: "day" | "week" | "month"
): Promise<{ title: string; abstract: string }[]> {
  const days = dateRange === "day" ? 1 : dateRange === "week" ? 7 : 30;
  const dates = Array.from({ length: days }, (_, i) => dateNDaysAgo(i));

  const results = await Promise.all(dates.map(fetchForDate));
  const seen = new Set<string>();
  const items: { title: string; abstract: string }[] = [];

  for (const batch of results) {
    for (const item of batch) {
      if (!seen.has(item.paper.id)) {
        seen.add(item.paper.id);
        items.push({ title: item.title || item.paper.title, abstract: "" });
        if (items.length >= limit) return items;
      }
    }
  }

  return items;
}

export async function downloadPdf(pdfUrl: string, paperId: string): Promise<string> {
  const safeId = paperId.replace(/[^a-zA-Z0-9._-]/g, "_");
  const tmpPath = path.join(os.tmpdir(), `paper_${safeId}.pdf`);

  const response = await axios.get(pdfUrl, {
    responseType: "arraybuffer",
    timeout: 60000,
  });

  await fs.writeFile(tmpPath, response.data);
  return tmpPath;
}

export async function deletePdf(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore if already deleted
  }
}

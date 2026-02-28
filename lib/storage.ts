import fs from "fs/promises";
import path from "path";
import type { PaperSummary, DayMeta } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "papers");
const CACHE_DIR = path.join(process.cwd(), "data", "cache");

function dateDirPath(date: string): string {
  return path.join(DATA_DIR, date);
}

function paperFilePath(date: string, paperId: string): string {
  const safeId = paperId.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(dateDirPath(date), `${safeId}.json`);
}

function metaFilePath(date: string): string {
  return path.join(dateDirPath(date), "meta.json");
}

export async function dayExists(date: string): Promise<boolean> {
  try {
    await fs.access(metaFilePath(date));
    return true;
  } catch {
    return false;
  }
}

export async function savePaper(
  date: string,
  paper: PaperSummary
): Promise<void> {
  const dir = dateDirPath(date);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(paperFilePath(date, paper.id), JSON.stringify(paper, null, 2));
}

export async function saveDayMeta(meta: DayMeta): Promise<void> {
  const dir = dateDirPath(meta.date);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(metaFilePath(meta.date), JSON.stringify(meta, null, 2));
}

export async function getDayMeta(date: string): Promise<DayMeta | null> {
  try {
    const raw = await fs.readFile(metaFilePath(date), "utf-8");
    return JSON.parse(raw) as DayMeta;
  } catch {
    return null;
  }
}

export async function getPaper(
  date: string,
  paperId: string
): Promise<PaperSummary | null> {
  try {
    const raw = await fs.readFile(paperFilePath(date, paperId), "utf-8");
    return JSON.parse(raw) as PaperSummary;
  } catch {
    return null;
  }
}

export async function getPapersForDate(
  date: string
): Promise<PaperSummary[]> {
  const meta = await getDayMeta(date);
  if (!meta) return [];

  const papers: PaperSummary[] = [];
  for (const id of meta.paperIds) {
    const paper = await getPaper(date, id);
    if (paper) papers.push(paper);
  }
  return papers;
}

export async function getAvailableDates(): Promise<string[]> {
  try {
    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
    const dates = entries
      .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
      .map((e) => e.name)
      .sort()
      .reverse();
    return dates;
  } catch {
    return [];
  }
}

export async function findPaperById(
  paperId: string
): Promise<{ paper: PaperSummary; date: string } | null> {
  const dates = await getAvailableDates();
  for (const date of dates) {
    const paper = await getPaper(date, paperId);
    if (paper) return { paper, date };
  }
  return null;
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

interface CacheEntry<T> {
  cacheDate: string;
  data: T;
}

function cacheFilePath(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const filePath = cacheFilePath(key);
    const raw = await fs.readFile(filePath, "utf-8");
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (entry.cacheDate === getCurrentISTDate()) {
      return entry.data;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  const filePath = cacheFilePath(key);
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const entry: CacheEntry<T> = {
    cacheDate: getCurrentISTDate(),
    data,
  };
  await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
}

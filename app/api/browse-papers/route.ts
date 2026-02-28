import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getPapersForDate } from "@/lib/storage";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/browse-papers");
const HF_DAILY_PAPERS_URL = "https://huggingface.co/api/daily_papers";

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

interface HFItem {
  paper: {
    id: string;
    title: string;
    authors: { name: string }[];
    publishedAt: string;
  };
  title: string;
  numUpvotes: number;
  mediaUrls?: string[];
  thumbnail?: string;
}

async function fetchForDate(date: string): Promise<HFItem[]> {
  try {
    const { data } = await axios.get(HF_DAILY_PAPERS_URL, {
      params: { date },
      timeout: 10000,
    });
    return data as HFItem[];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "today";
  const req = log.request("GET", "/api/browse-papers", { range });

  try {
    let allItems: HFItem[];

    if (range === "week") {
      const dates = Array.from({ length: 7 }, (_, i) => dateNDaysAgo(i));
      const results = await Promise.all(dates.map(fetchForDate));
      const seen = new Set<string>();
      allItems = [];
      for (const batch of results) {
        for (const item of batch) {
          if (!seen.has(item.paper.id)) {
            seen.add(item.paper.id);
            allItems.push(item);
          }
        }
      }
    } else {
      const { data } = await axios.get(HF_DAILY_PAPERS_URL);
      allItems = data as HFItem[];
    }

    const today = todayDate();
    const existingPapers = await getPapersForDate(today);
    const importedIds = new Set(existingPapers.map((p) => p.id));

    const papers = allItems
      .sort((a, b) => b.numUpvotes - a.numUpvotes)
      .map((item) => ({
        id: item.paper.id,
        title: item.title || item.paper.title,
        authors: item.paper.authors.map((a) => a.name),
        upvotes: item.numUpvotes,
        publishedAt: item.paper.publishedAt,
        imported: importedIds.has(item.paper.id),
        thumbnail: item.thumbnail,
      }));

    req.done(200, { total: papers.length, range });
    return NextResponse.json({ papers });
  } catch (err) {
    req.fail(500, err);
    return NextResponse.json(
      { error: "Failed to fetch papers from HuggingFace" },
      { status: 500 }
    );
  }
}

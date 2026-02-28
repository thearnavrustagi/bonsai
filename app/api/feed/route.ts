import { NextRequest, NextResponse } from "next/server";
import { getCached, setCache } from "@/lib/storage";
import { batchGenerateTags } from "@/lib/gemini";
import { fetchDailyPapers } from "@/lib/huggingface";
import { fetchArxivPapers } from "@/lib/arxiv";
import {
  isHuggingFaceSource,
  getArxivCategoriesForSubtopic,
  type TopicId,
} from "@/lib/topics";
import type { FeedPaper } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = (searchParams.get("topic") || "ai") as TopicId;
  const subtopic = searchParams.get("subtopic") || "everything";

  const cacheKey = `feed/${topic}-${subtopic}`;

  try {
    const cached = await getCached<FeedPaper[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ papers: cached });
    }

    let rawPapers: {
      id: string;
      title: string;
      authors: string[];
      abstract: string;
      arxivUrl: string;
      pdfUrl: string;
      publishedAt: string;
      mediaUrls: string[];
      thumbnail?: string;
      source: "huggingface" | "arxiv";
    }[];

    if (isHuggingFaceSource(topic, subtopic)) {
      const hfPapers = await fetchDailyPapers(10);
      rawPapers = hfPapers.map((p) => ({
        id: p.id,
        title: p.title,
        authors: p.authors,
        abstract: "",
        arxivUrl: p.arxivUrl,
        pdfUrl: p.pdfUrl,
        publishedAt: p.publishedAt,
        mediaUrls: p.mediaUrls,
        thumbnail: p.thumbnail,
        source: "huggingface" as const,
      }));
    } else {
      const categories = getArxivCategoriesForSubtopic(topic, subtopic);
      if (categories.length === 0) {
        return NextResponse.json({ papers: [] });
      }
      const arxivPapers = await fetchArxivPapers(categories, 30);
      rawPapers = arxivPapers.slice(0, 10).map((p) => ({
        id: p.id,
        title: p.title,
        authors: p.authors,
        abstract: p.abstract,
        arxivUrl: p.arxivUrl,
        pdfUrl: p.pdfUrl,
        publishedAt: p.publishedAt,
        mediaUrls: [],
        source: "arxiv" as const,
      }));
    }

    if (rawPapers.length === 0) {
      return NextResponse.json({ papers: [] });
    }

    let tags: { mlTag: string; appTag: string; description: string }[];
    try {
      tags = await batchGenerateTags(
        rawPapers.map((p) => ({ title: p.title, abstract: p.abstract }))
      );
    } catch {
      tags = rawPapers.map(() => ({
        mlTag: "Other",
        appTag: "General",
        description: "",
      }));
    }

    const papers: FeedPaper[] = rawPapers.map((p, i) => ({
      id: p.id,
      title: p.title,
      authors: p.authors,
      abstract: p.abstract,
      description: tags[i]?.description || p.abstract.slice(0, 200),
      mlTag: tags[i]?.mlTag || "Other",
      appTag: tags[i]?.appTag || "General",
      arxivUrl: p.arxivUrl,
      pdfUrl: p.pdfUrl,
      publishedAt: p.publishedAt,
      mediaUrls: p.mediaUrls,
      thumbnail: p.thumbnail,
      source: p.source,
    }));

    if (papers.length > 0) {
      await setCache(cacheKey, papers);
    }

    return NextResponse.json({ papers });
  } catch (err) {
    console.error("Feed API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}

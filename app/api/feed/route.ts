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

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = (searchParams.get("topic") || "ai") as TopicId;
  const subtopic = searchParams.get("subtopic") || "everything";

  const cacheKey = `feed/${topic}-${subtopic}`;

  const refresh = searchParams.get("refresh") === "true";

  console.log(`[feed] GET topic=${topic} subtopic=${subtopic} refresh=${refresh}`);

  try {
    if (!refresh) {
      const cached = await getCached<FeedPaper[]>(cacheKey);
      if (cached) {
        console.log(`[feed] Returning ${cached.length} cached papers`);
        return NextResponse.json({ papers: cached });
      }
      console.log("[feed] No cache hit, fetching fresh");
    } else {
      console.log("[feed] Refresh requested, skipping cache");
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
      console.log("[feed] Fetching from HuggingFace...");
      const hfPapers = await fetchDailyPapers(10);
      console.log(`[feed] HuggingFace returned ${hfPapers.length} papers:`, hfPapers.map(p => p.title));
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
        console.log("[feed] No arXiv categories found, returning empty");
        return NextResponse.json({ papers: [] });
      }
      console.log(`[feed] Fetching from arXiv categories: ${categories.join(", ")}`);
      const arxivPapers = await fetchArxivPapers(categories, 30);
      console.log(`[feed] arXiv returned ${arxivPapers.length} papers`);
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
      console.log("[feed] No raw papers from fresh fetch");
      const cached = await getCached<FeedPaper[]>(cacheKey);
      if (cached && cached.length > 0) {
        console.log(`[feed] Falling back to ${cached.length} cached papers`);
        return NextResponse.json({ papers: cached });
      }
      console.log("[feed] No cache fallback either, returning empty");
      return NextResponse.json({ papers: [] });
    }

    console.log(`[feed] Generating tags for ${rawPapers.length} papers...`);
    let tags: { mlTag: string; appTag: string; description: string }[];
    try {
      tags = await batchGenerateTags(
        rawPapers.map((p) => ({ title: p.title, abstract: p.abstract }))
      );
      console.log(`[feed] Tags generated successfully`);
    } catch (tagErr) {
      console.error("[feed] Tag generation failed:", tagErr);
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

    console.log(`[feed] Final response: ${papers.length} papers, IDs: [${papers.map(p => p.id).join(", ")}]`);

    if (papers.length > 0) {
      await setCache(cacheKey, papers);
      console.log("[feed] Cache updated");
    }

    const headers: Record<string, string> = {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    };
    return NextResponse.json({ papers }, { headers });
  } catch (err) {
    console.error("[feed] API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}

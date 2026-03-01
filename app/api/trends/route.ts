import { NextRequest, NextResponse } from "next/server";
import { getCached, setCache } from "@/lib/storage";
import { generateTrends } from "@/lib/gemini";
import { fetchArxivItems } from "@/lib/arxiv";
import { fetchDailyPaperItems } from "@/lib/huggingface";
import {
  isHuggingFaceSource,
  getArxivCategoriesForSubtopic,
  getTopicLabel,
  getSubtopicLabel,
  type TopicId,
} from "@/lib/topics";

type Range = "day" | "week" | "month";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = (searchParams.get("topic") || "ai") as TopicId;
  const subtopic = searchParams.get("subtopic") || "everything";
  const range = (searchParams.get("range") || "month") as Range;

  const cacheKey = `trends/${topic}-${subtopic}-${range}`;

  const refresh = searchParams.get("refresh") === "true";

  try {
    if (!refresh) {
      const cached = await getCached<string>(cacheKey);
      if (cached) {
        return NextResponse.json({ content: cached });
      }
    }

    let items: { title: string; abstract: string }[];

    if (isHuggingFaceSource(topic, subtopic)) {
      items = await fetchDailyPaperItems(50, range);
    } else {
      const categories = getArxivCategoriesForSubtopic(topic, subtopic);
      if (categories.length === 0) {
        return NextResponse.json({ content: "" });
      }
      items = await fetchArxivItems(categories, 50, range);
    }

    if (items.length === 0) {
      return NextResponse.json({ content: "No papers found for this period." });
    }

    const topicLabel = getTopicLabel(topic);
    const subtopicLabel = getSubtopicLabel(topic, subtopic);
    const content = await generateTrends(items, topicLabel, subtopicLabel, range);

    await setCache(cacheKey, content);

    const headers = refresh ? { "Cache-Control": "no-store, no-cache, must-revalidate" } : undefined;
    return NextResponse.json({ content }, { headers });
  } catch (err) {
    console.error("Trends API error:", err);
    return NextResponse.json(
      { error: "Failed to generate trends", content: "" },
      { status: 500 }
    );
  }
}

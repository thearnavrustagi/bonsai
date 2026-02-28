import { NextRequest, NextResponse } from "next/server";
import { getCached, setCache } from "@/lib/storage";
import { generateTrends } from "@/lib/gemini";
import { fetchArxivTitles } from "@/lib/arxiv";
import { fetchDailyPaperTitles } from "@/lib/huggingface";
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

  try {
    const cached = await getCached<string>(cacheKey);
    if (cached) {
      return NextResponse.json({ content: cached });
    }

    let titles: string[];

    if (isHuggingFaceSource(topic, subtopic)) {
      titles = await fetchDailyPaperTitles(50, range);
    } else {
      const categories = getArxivCategoriesForSubtopic(topic, subtopic);
      if (categories.length === 0) {
        return NextResponse.json({ content: "" });
      }
      titles = await fetchArxivTitles(categories, 50, range);
    }

    if (titles.length === 0) {
      return NextResponse.json({ content: "No papers found for this period." });
    }

    const topicLabel = getTopicLabel(topic);
    const subtopicLabel = getSubtopicLabel(topic, subtopic);
    const content = await generateTrends(titles, topicLabel, subtopicLabel, range);

    await setCache(cacheKey, content);

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Trends API error:", err);
    return NextResponse.json(
      { error: "Failed to generate trends", content: "" },
      { status: 500 }
    );
  }
}

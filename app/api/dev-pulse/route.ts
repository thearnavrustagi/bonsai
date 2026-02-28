import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { getCached, setCache } from "@/lib/storage";
import { generateDevPulse } from "@/lib/gemini";

const CACHE_KEY = "dev-pulse";

const SIMON_FEED_URL = "https://simonwillison.net/atom/everything/";
const RUNDOWN_FEED_URL = "https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml";

const simonParser = new Parser({
  customFields: { item: [["summary", "summaryHtml"]] },
});

const rundownParser = new Parser({
  customFields: { item: [["dc:creator", "creator"]] },
});

async function fetchTitlesFromFeed(
  parser: Parser,
  url: string,
  limit: number
): Promise<string[]> {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items ?? [])
      .slice(0, limit)
      .map((item) => item.title || "")
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const cached = await getCached<string>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ content: cached });
    }

    const [blogTitles, rundownTitles] = await Promise.all([
      fetchTitlesFromFeed(simonParser, SIMON_FEED_URL, 15),
      fetchTitlesFromFeed(rundownParser, RUNDOWN_FEED_URL, 10),
    ]);

    const allTitles = [...blogTitles, ...rundownTitles];

    if (allTitles.length === 0) {
      return NextResponse.json({ content: "" });
    }

    const content = await generateDevPulse(allTitles);
    await setCache(CACHE_KEY, content);

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Dev Pulse API error:", err);
    return NextResponse.json(
      { error: "Failed to generate dev pulse", content: "" },
      { status: 500 }
    );
  }
}

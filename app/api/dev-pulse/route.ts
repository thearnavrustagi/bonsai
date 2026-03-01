import { NextRequest, NextResponse } from "next/server";
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

interface FeedItem {
  title: string;
  snippet: string;
}

async function fetchItemsFromFeed(
  parser: Parser,
  url: string,
  limit: number
): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items ?? [])
      .slice(0, limit)
      .filter((item) => item.title)
      .map((item) => {
        const plainText = (item.contentSnippet || item.summary || "").replace(/<[^>]+>/g, "");
        return {
          title: item.title!,
          snippet: plainText.slice(0, 200).trim(),
        };
      });
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "true";

  try {
    if (!refresh) {
      const cached = await getCached<string>(CACHE_KEY);
      if (cached) {
        return NextResponse.json({ content: cached });
      }
    }

    const [blogItems, rundownItems] = await Promise.all([
      fetchItemsFromFeed(simonParser, SIMON_FEED_URL, 15),
      fetchItemsFromFeed(rundownParser, RUNDOWN_FEED_URL, 10),
    ]);

    const allItems = [...blogItems, ...rundownItems];

    if (allItems.length === 0) {
      return NextResponse.json({ content: "" });
    }

    const content = await generateDevPulse(allItems);
    await setCache(CACHE_KEY, content);

    const headers = refresh ? { "Cache-Control": "no-store, no-cache, must-revalidate" } : undefined;
    return NextResponse.json({ content }, { headers });
  } catch (err) {
    console.error("Dev Pulse API error:", err);
    return NextResponse.json(
      { error: "Failed to generate dev pulse", content: "" },
      { status: 500 }
    );
  }
}

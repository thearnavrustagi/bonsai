import { NextResponse } from "next/server";
import Parser from "rss-parser";

export interface BusinessArticle {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
  content: string;
  source: string;
  thumbnail: string;
}

const parser = new Parser({
  customFields: {
    item: [["dc:creator", "creator"]],
  },
});

const FEED_URL =
  "https://techcrunch.com/category/artificial-intelligence/feed/";

async function fetchOgImage(url: string): Promise<string> {
  if (!url) return "";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return "";
    const html = await res.text();
    const ogMatch =
      html.match(
        /<meta[^>]+property\s*=\s*["']og:image["'][^>]+content\s*=\s*["']([^"']+)["']/i
      ) ||
      html.match(
        /<meta[^>]+content\s*=\s*["']([^"']+)["'][^>]+property\s*=\s*["']og:image["']/i
      );
    return ogMatch?.[1] || "";
  } catch {
    return "";
  }
}

export async function GET() {
  try {
    const feed = await parser.parseURL(FEED_URL);
    const items = (feed.items ?? []).slice(0, 15);

    const ogResults = await Promise.allSettled(
      items.slice(0, 5).map((item) => fetchOgImage(item.link || ""))
    );
    const ogImages = ogResults.map((r) =>
      r.status === "fulfilled" ? r.value : ""
    );

    const articles: BusinessArticle[] = items.map((item, i) => {
      const anyItem = item as unknown as Record<string, string>;
      const rawContent =
        anyItem["content:encoded"] ||
        item.content ||
        item.summary ||
        "";
      const plainText = rawContent.replace(/<[^>]+>/g, "");
      const snippet =
        item.contentSnippet?.slice(0, 220) || plainText.slice(0, 220);

      return {
        id: Buffer.from(item.link || item.guid || "").toString("base64url"),
        title: item.title || "Untitled",
        link: item.link || "",
        pubDate: item.pubDate || item.isoDate || "",
        snippet: snippet + (snippet.length >= 220 ? "…" : ""),
        content: rawContent,
        source: "TechCrunch",
        thumbnail: i < 5 ? ogImages[i] || "" : "",
      };
    });

    return NextResponse.json(
      { articles },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=900, stale-while-revalidate=1800",
        },
      }
    );
  } catch (err) {
    console.error("Failed to fetch business feed:", err);
    return NextResponse.json({ articles: [] }, { status: 500 });
  }
}

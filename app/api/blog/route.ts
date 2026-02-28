import { NextResponse } from "next/server";
import Parser from "rss-parser";

export interface BlogPost {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
  content: string;
  type: "highlight" | "update";
}

const parser = new Parser({
  customFields: {
    item: [["summary", "summaryHtml"]],
  },
});

const FEED_URL = "https://simonwillison.net/atom/everything/";

const SIMON_DOMAINS = [
  "simonwillison.net",
  "tools.simonwillison.net",
  "til.simonwillison.net",
  "datasette.io",
];

function classifyPost(rawContent: string, link: string): "highlight" | "update" {
  if (link.includes("simonwillison.net/guides/")) return "highlight";

  const boldLinkMatch = rawContent.match(
    /^<p>\s*<strong>\s*<a\s+href="([^"]+)"/
  );
  if (!boldLinkMatch) return "highlight";

  try {
    const href = new URL(boldLinkMatch[1]);
    if (SIMON_DOMAINS.some((d) => href.hostname === d || href.hostname.endsWith("." + d))) {
      return "highlight";
    }
  } catch {
    return "highlight";
  }

  return "update";
}

export async function GET() {
  try {
    const feed = await parser.parseURL(FEED_URL);

    const posts: BlogPost[] = (feed.items ?? []).slice(0, 15).map((item) => {
      const anyItem = item as unknown as Record<string, string>;
      const rawContent =
        anyItem["content:encoded"] ||
        item.content ||
        anyItem.summaryHtml ||
        item.summary ||
        "";
      const plainText = rawContent.replace(/<[^>]+>/g, "");
      const snippet =
        item.contentSnippet?.slice(0, 200) || plainText.slice(0, 200);
      const link = item.link || "";

      return {
        id: Buffer.from(link || item.guid || "").toString("base64url"),
        title: item.title || "Untitled",
        link,
        pubDate: item.pubDate || item.isoDate || "",
        snippet: snippet + (snippet.length >= 200 ? "…" : ""),
        content: rawContent,
        type: classifyPost(rawContent, link),
      };
    });

    return NextResponse.json(
      { posts },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      }
    );
  } catch (err) {
    console.error("Failed to fetch blog feed:", err);
    return NextResponse.json({ posts: [] }, { status: 500 });
  }
}

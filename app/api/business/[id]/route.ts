import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let url: string;
  try {
    url = Buffer.from(id, "base64url").toString("utf-8");
    if (!url.startsWith("https://techcrunch.com/")) {
      return NextResponse.json(
        { error: "Invalid article URL" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid article ID" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
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

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch article" },
        { status: 502 }
      );
    }

    const html = await res.text();

    const content = extractArticleContent(html);

    return NextResponse.json(
      { content },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

function extractArticleContent(html: string): string {
  // TechCrunch uses <div class="entry-content ..."> for article body
  const entryMatch = html.match(
    /<div\s[^>]*class="[^"]*\bentry-content\b[^"]*"[^>]*>([\s\S]*?)(?=<div\s[^>]*class="[^"]*\b(?:article-footer|post-footer|related-posts|comment)|<footer|<\/article)/i
  );
  if (entryMatch) return cleanHtml(entryMatch[1]);

  // Fallback: <div class="article-content">
  const articleContentMatch = html.match(
    /<div\s[^>]*class="[^"]*\barticle-content\b[^"]*"[^>]*>([\s\S]*?)(?=<div\s[^>]*class="[^"]*\b(?:article-footer|post-footer|related-posts|comment)|<footer|<\/article)/i
  );
  if (articleContentMatch) return cleanHtml(articleContentMatch[1]);

  // Fallback: look for wp-block-post-content
  const wpBlockMatch = html.match(
    /<div\s[^>]*class="[^"]*\bwp-block-post-content\b[^"]*"[^>]*>([\s\S]*?)(?=<div\s[^>]*class="[^"]*\b(?:article-footer|post-footer|related-posts|comment)|<footer|<\/article)/i
  );
  if (wpBlockMatch) return cleanHtml(wpBlockMatch[1]);

  // Last resort: content inside <article> tag
  const articleTag = html.match(
    /<article[^>]*>([\s\S]*?)<\/article>/i
  );
  if (articleTag) return cleanHtml(articleTag[1]);

  return "";
}

function cleanHtml(html: string): string {
  // Truncate at author bio / "Most Popular" / related articles / next-article loader
  // These mark the end of actual article content on TechCrunch pages
  const endMarkers = [
    /<!--\s*\/wp:post-content\s*-->/i,
    /<div[^>]*class="[^"]*\b(?:author-bio|author-card|article-author|post-author|writer-bio|most-popular|related-posts|related-articles|next-article|infinite-scroll|load-more)[^"]*"/i,
    /<(?:h[2-4]|strong)[^>]*>\s*(?:Most\s+Popular|Related\s+(?:Articles|Stories|Posts)|More\s+from\s+TechCrunch|View\s+Bio)\s*<\//i,
    /<[^>]*(?:Loading\s+the\s+next\s+article|Error\s+loading)/i,
  ];

  let truncated = html;
  for (const marker of endMarkers) {
    const idx = truncated.search(marker);
    if (idx > 0) {
      truncated = truncated.slice(0, idx);
    }
  }

  let cleaned = truncated
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+data-[\w-]+="[^"]*"/gi, "")
    .replace(/<[^>]+aria-hidden="true"[^>]*>[\s\S]*?<\/[^>]+>/gi, "");

  // Remove ad / promo / sponsor containers
  cleaned = cleaned.replace(
    /<div[^>]*class="[^"]*\b(?:ad-|ads-|advert|sponsor|newsletter|signup|promo|wp-block-tc-ads|tc-event|event-promo|cta-|commerce-|fundraise)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    ""
  );

  cleaned = cleaned.replace(
    /<(?:figure|section|div)[^>]*class="[^"]*\b(?:wp-block-embed|tc-promo|article-promo|inline-promo)[^"]*"[^>]*>[\s\S]*?<\/(?:figure|section|div)>/gi,
    ""
  );

  // Remove TC event promos by content
  cleaned = cleaned.replace(
    /<(?:div|section|figure)[^>]*>(?:[\s\S]*?(?:TechCrunch\s+(?:Founder\s+Summit|Disrupt|StrictlyVC|Sessions)|REGISTER\s+NOW|Offer\s+ends|Save\s+up\s+to\s+\$)[\s\S]*?)<\/(?:div|section|figure)>/gi,
    ""
  );

  cleaned = cleaned.replace(
    /<(?:p|h[1-6])[^>]*>[^<]*(?:REGISTER\s+NOW|Offer\s+ends)[^<]*<\/(?:p|h[1-6])>/gi,
    ""
  );

  return cleaned.trim();
}

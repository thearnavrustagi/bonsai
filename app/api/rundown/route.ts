import { NextResponse } from "next/server";
import Parser from "rss-parser";

export interface RundownArticle {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
  content: string;
  thumbnail: string;
}

const parser = new Parser({
  customFields: {
    item: [["dc:creator", "creator"]],
  },
});

const FEED_URL = "https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml";

function extractFirstImage(html: string): string {
  const imgRegex = /<img[^>]+src\s*=\s*"([^"]+)"[^>]*>/gi;
  let match;
  let validCount = 0;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    const fullTag = match[0];
    if (/beehiiv\.com.*(?:logo|icon|brand|pixel|track)/i.test(src)) continue;
    if (/therundown/i.test(src)) continue;
    if (/width\s*=\s*["']?1["']?/i.test(fullTag)) continue;
    if (/height\s*=\s*["']?1["']?/i.test(fullTag)) continue;
    const altMatch = fullTag.match(/alt\s*=\s*"([^"]*)"/i);
    if (altMatch && /rundown|banner|header|logo|newsletter/i.test(altMatch[1]))
      continue;
    validCount++;
    if (validCount === 1) continue;
    return src;
  }
  return "";
}

function cleanBeehiivHtml(raw: string): string {
  let html = raw;

  // Strip beehiiv template variables: {{ first_name | default }}
  html = html.replace(/\{\{[^}]*\}\}/g, "");

  // Remove tracking pixels (tiny images)
  html = html.replace(
    /<img[^>]*(?:width\s*=\s*["']?1["']?|height\s*=\s*["']?1["']?|beacon|track|pixel|open\.beehiiv)[^>]*\/?>/gi,
    ""
  );

  // Remove "Read Online | Sign Up | Advertise" header nav links
  html = html.replace(
    /<(?:div|table|tr|td|p|span|a)[^>]*>[\s\S]*?Read\s+Online[\s\S]*?<\/(?:div|table|tr|td|p|span|a)>/gi,
    (match) => {
      if (match.length < 1500) return "";
      return match;
    }
  );

  // Remove "The Rundown AI" branding/logo blocks
  html = html.replace(
    /<(?:div|table|td)[^>]*>[\s\S]*?<img[^>]*(?:therundown|rundown.*logo)[^>]*>[\s\S]*?<\/(?:div|table|td)>/gi,
    (match) => {
      if (match.length < 3000) return "";
      return match;
    }
  );

  // Remove "Sponsored by" sections
  html = html.replace(
    /<(?:div|table|td|tr|p|span)[^>]*>[\s]*(?:Sponsored\s+by|Presented\s+by)[\s\S]*?<\/(?:div|table|td|tr|p|span)>/gi,
    (match) => {
      if (match.length < 2000) return "";
      return match;
    }
  );

  // Remove footer: unsubscribe, update preferences, social links
  html = html.replace(
    /<(?:div|table|td|p)[^>]*>[\s\S]*?(?:Unsubscribe|Update your preferences|No longer want|Manage preferences)[\s\S]*$/gi,
    ""
  );

  // Remove beehiiv referral/share blocks
  html = html.replace(
    /<(?:div|table|td)[^>]*>[\s\S]*?(?:Share The Rundown|Refer a friend|Share this newsletter)[\s\S]*?<\/(?:div|table|td)>/gi,
    (match) => {
      if (match.length < 3000) return "";
      return match;
    }
  );

  // Strip all inline style attributes
  html = html.replace(/\s+style\s*=\s*"[^"]*"/gi, "");
  html = html.replace(/\s+style\s*=\s*'[^']*'/gi, "");

  // Strip class attributes (beehiiv classes are meaningless outside their CSS)
  html = html.replace(/\s+class\s*=\s*"[^"]*"/gi, "");
  html = html.replace(/\s+class\s*=\s*'[^']*'/gi, "");

  // Strip width/height/align/bgcolor/cellpadding/cellspacing attributes
  html = html.replace(
    /\s+(?:width|height|align|valign|bgcolor|cellpadding|cellspacing|border|role)\s*=\s*"[^"]*"/gi,
    ""
  );

  // Unwrap table layout into divs (beehiiv uses tables for layout)
  html = html.replace(/<\/?table[^>]*>/gi, "");
  html = html.replace(/<\/?tbody[^>]*>/gi, "");
  html = html.replace(/<\/?thead[^>]*>/gi, "");
  html = html.replace(/<tr[^>]*>/gi, "<div>");
  html = html.replace(/<\/tr>/gi, "</div>");
  html = html.replace(/<td[^>]*>/gi, "<div>");
  html = html.replace(/<\/td>/gi, "</div>");

  // Remove empty links and divs
  html = html.replace(/<a[^>]*>\s*<\/a>/gi, "");
  html = html.replace(/<div>\s*<\/div>/gi, "");
  html = html.replace(/<p>\s*<\/p>/gi, "");
  html = html.replace(/<span>\s*<\/span>/gi, "");

  // Collapse excessive whitespace/newlines
  html = html.replace(/(\s*<br\s*\/?>\s*){3,}/gi, "<br><br>");
  html = html.replace(/\n{3,}/g, "\n\n");

  // Remove center tags
  html = html.replace(/<\/?center[^>]*>/gi, "");

  // Clean up image tags: keep src and alt only
  html = html.replace(/<img([^>]*)>/gi, (_match, attrs: string) => {
    const srcMatch = attrs.match(/src\s*=\s*"([^"]*)"/i);
    const altMatch = attrs.match(/alt\s*=\s*"([^"]*)"/i);
    if (!srcMatch) return "";
    const src = srcMatch[1];
    // Skip beehiiv assets/logos/icons
    if (/beehiiv\.com.*(?:logo|icon|brand|pixel|track)/i.test(src)) return "";
    if (/therundown.*(?:logo|brand|icon)/i.test(src)) return "";
    const alt = altMatch ? ` alt="${altMatch[1]}"` : "";
    return `<img src="${src}"${alt} />`;
  });

  return html.trim();
}

export async function GET() {
  try {
    const feed = await parser.parseURL(FEED_URL);

    const articles: RundownArticle[] = (feed.items ?? [])
      .slice(0, 10)
      .map((item) => {
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
          content: cleanBeehiivHtml(rawContent),
          thumbnail: extractFirstImage(rawContent),
        };
      });

    return NextResponse.json(
      { articles },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (err) {
    console.error("Failed to fetch Rundown feed:", err);
    return NextResponse.json({ articles: [] }, { status: 500 });
  }
}

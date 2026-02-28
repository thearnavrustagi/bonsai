"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BusinessArticle {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
  content: string;
  source: string;
  thumbnail: string;
}

interface TechCrunchPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const JUNK_TEXT_PATTERN =
  /TechCrunch\s+(Founder\s+Summit|Disrupt|StrictlyVC|Sessions)|REGISTER\s+NOW|Offer\s+ends\s+\w+\s+\d|Save\s+up\s+to\s+\$|Most\s+Popular|Related\s+(Articles|Stories|Posts)|More\s+from\s+TechCrunch|View\s+Bio|Loading\s+the\s+next\s+article|Error\s+loading/i;

function useCleanedContent(rawHtml: string) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.innerHTML = rawHtml;

    // Remove empty wrapper divs
    el.querySelectorAll("div").forEach((div) => {
      if (!div.textContent?.trim() && !div.querySelector("img")) {
        div.remove();
      }
    });

    // Remove tracking pixels
    el.querySelectorAll("img").forEach((img) => {
      const src = img.src || "";
      if (/pixel|track|beacon/i.test(src)) {
        img.remove();
        return;
      }
      if (
        (img.naturalWidth > 0 && img.naturalWidth <= 3) ||
        (img.naturalHeight > 0 && img.naturalHeight <= 3)
      ) {
        img.remove();
      }
    });

    // Remove iframes, asides, forms, navs
    el.querySelectorAll("iframe, aside, form, nav").forEach((n) => n.remove());

    // Remove elements by junk class names
    el.querySelectorAll(
      '[class*="ad-"], [class*="ads-"], [class*="promo"], [class*="sponsor"], [class*="newsletter"], [class*="signup"], [class*="cta-"], [class*="commerce"], [class*="tc-event"], [class*="wp-block-tc-ads"], [class*="author-bio"], [class*="author-card"], [class*="post-author"], [class*="writer-bio"], [class*="most-popular"], [class*="related-posts"], [class*="related-articles"], [class*="next-article"], [class*="infinite-scroll"], [class*="load-more"]'
    ).forEach((n) => n.remove());

    // Remove any remaining blocks whose text matches junk patterns
    el.querySelectorAll("div, section, figure, ul").forEach((block) => {
      const text = block.textContent || "";
      if (JUNK_TEXT_PATTERN.test(text)) {
        const articleText = el.textContent || "";
        if (text.length < articleText.length * 0.5) {
          block.remove();
        }
      }
    });

    // Force all links to open in new tab
    el.querySelectorAll("a").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
  }, [rawHtml]);

  return containerRef;
}

export default function TechCrunchArticlePage({ params }: TechCrunchPageProps) {
  const { id } = use(params);
  const [article, setArticle] = useState<BusinessArticle | null>(null);
  const [fullContent, setFullContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [metaRes, contentRes] = await Promise.allSettled([
          fetch("/api/business"),
          fetch(`/api/business/${id}`),
        ]);

        if (metaRes.status === "fulfilled" && metaRes.value.ok) {
          const data = await metaRes.value.json();
          const found = (data.articles as BusinessArticle[]).find(
            (a) => a.id === id
          );
          if (found) {
            setArticle(found);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }

        if (contentRes.status === "fulfilled" && contentRes.value.ok) {
          const data = await contentRes.value.json();
          setFullContent(data.content || "");
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setContentLoading(false);
      }
    }
    load();
  }, [id]);

  const displayContent = fullContent || article?.content || "";
  const contentRef = useCleanedContent(displayContent);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Skeleton className="h-4 w-32 bg-surface rounded-lg mb-10" />
          <div className="space-y-3 mb-8">
            <Skeleton className="h-5 w-48 bg-surface rounded-lg" />
            <Skeleton className="h-12 w-full bg-surface rounded-lg" />
          </div>
          <div className="space-y-4">
            {[95, 88, 78, 92, 85, 70, 97, 82].map((w, i) => (
              <Skeleton
                key={i}
                className="h-4 bg-surface rounded-lg"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-warm-white mb-4">
            Article not found
          </h1>
          <p className="font-[family-name:var(--font-lora)] text-beige-dim text-sm mb-8">
            This article may no longer be available in the feed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm font-medium px-6 py-2.5 rounded-full border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-all duration-300"
          >
            <ArrowLeft className="size-4" />
            Return home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm text-beige-dim hover:text-emerald-400 transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="size-4" />
          Back to BonsAI
        </Link>

        <article>
          {article.thumbnail && (
            <div className="relative w-full aspect-[2.2/1] overflow-hidden rounded-xl border border-emerald-500/15 mb-6">
              <img
                src={article.thumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            </div>
          )}

          <header className="mb-8">
            <time className="block font-[family-name:var(--font-lora)] text-xs text-beige-dim tracking-wider mb-3">
              {formatDate(article.pubDate)}
            </time>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-warm-white leading-tight mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-emerald-400" />
                <span className="font-[family-name:var(--font-dm-sans)] text-xs text-emerald-400">
                  TechCrunch
                </span>
              </div>
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-[family-name:var(--font-dm-sans)] text-xs text-emerald-500/70 hover:text-emerald-400 transition-colors"
              >
                Original
                <ExternalLink className="size-3" />
              </a>
            </div>
          </header>

          <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent mb-8" />

          {contentLoading && !displayContent ? (
            <div className="space-y-4">
              {[95, 88, 78, 92, 85, 70, 97, 82, 90, 75].map((w, i) => (
                <Skeleton
                  key={i}
                  className="h-4 bg-surface rounded-lg"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          ) : (
            <div
              ref={contentRef}
              className="techcrunch-content prose prose-invert prose-sm sm:prose-base max-w-none
                prose-headings:font-[family-name:var(--font-playfair)] prose-headings:text-warm-white prose-headings:font-bold
                prose-p:font-[family-name:var(--font-lora)] prose-p:text-beige prose-p:leading-relaxed
                prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-warm-white
                prose-code:text-emerald-400/90 prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
                prose-pre:bg-surface prose-pre:border prose-pre:border-divider prose-pre:rounded-xl
                prose-blockquote:border-emerald-500/30 prose-blockquote:text-beige-dim
                prose-li:font-[family-name:var(--font-lora)] prose-li:text-beige
                prose-img:rounded-xl prose-img:border prose-img:border-divider"
            />
          )}
        </article>

        <footer className="py-8 mt-8">
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent mb-6" />
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm text-beige-dim hover:text-emerald-400 transition-colors duration-200"
            >
              <ArrowLeft className="size-4" />
              Back to BonsAI
            </Link>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-[family-name:var(--font-dm-sans)] text-sm text-emerald-500/70 hover:text-emerald-400 transition-colors"
            >
              Read on TechCrunch
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

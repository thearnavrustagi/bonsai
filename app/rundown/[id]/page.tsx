"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RundownArticle {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
  content: string;
}

interface RundownPageProps {
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

function useCleanedContent(rawHtml: string) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.innerHTML = rawHtml;

    // Remove empty wrapper divs that collapse to nothing
    el.querySelectorAll("div").forEach((div) => {
      if (!div.textContent?.trim() && !div.querySelector("img")) {
        div.remove();
      }
    });

    // Remove any remaining beehiiv logos/branding images
    el.querySelectorAll("img").forEach((img) => {
      const src = img.src || "";
      if (
        /beehiiv|therundown.*logo|rundown.*brand|pixel|track|beacon/i.test(src)
      ) {
        img.remove();
        return;
      }
      // Remove tiny images (tracking pixels that slipped through)
      if (
        (img.naturalWidth > 0 && img.naturalWidth <= 3) ||
        (img.naturalHeight > 0 && img.naturalHeight <= 3)
      ) {
        img.remove();
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

export default function RundownArticlePage({ params }: RundownPageProps) {
  const { id } = use(params);
  const [article, setArticle] = useState<RundownArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/rundown");
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = await res.json();
        const found = (data.articles as RundownArticle[]).find(
          (a) => a.id === id
        );
        if (found) {
          setArticle(found);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const contentRef = useCleanedContent(article?.content ?? "");

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
            className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm font-medium px-6 py-2.5 rounded-full border border-simon-purple/20 text-simon-purple-light hover:bg-simon-purple/10 transition-all duration-300"
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
          className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm text-beige-dim hover:text-simon-purple-light transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="size-4" />
          Back to BonsAI
        </Link>

        <article>
          <header className="mb-8">
            <time className="block font-[family-name:var(--font-lora)] text-xs text-beige-dim tracking-wider mb-3">
              {formatDate(article.pubDate)}
            </time>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-warm-white leading-tight mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Newspaper className="size-3.5 text-simon-purple-light" />
                <span className="font-[family-name:var(--font-dm-sans)] text-xs text-simon-purple-light">
                  The Rundown AI
                </span>
              </div>
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-[family-name:var(--font-dm-sans)] text-xs text-simon-purple/70 hover:text-simon-purple-light transition-colors"
              >
                Original
                <ExternalLink className="size-3" />
              </a>
            </div>
          </header>

          <div className="h-px bg-gradient-to-r from-transparent via-simon-purple/20 to-transparent mb-8" />

          <div
            ref={contentRef}
            className="rundown-content prose prose-invert prose-sm sm:prose-base max-w-none
              prose-headings:font-[family-name:var(--font-playfair)] prose-headings:text-warm-white prose-headings:font-bold
              prose-p:font-[family-name:var(--font-lora)] prose-p:text-beige prose-p:leading-relaxed
              prose-a:text-simon-purple-light prose-a:no-underline hover:prose-a:underline
              prose-strong:text-warm-white
              prose-code:text-simon-purple-light/90 prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
              prose-pre:bg-surface prose-pre:border prose-pre:border-divider prose-pre:rounded-xl
              prose-blockquote:border-simon-purple/30 prose-blockquote:text-beige-dim
              prose-li:font-[family-name:var(--font-lora)] prose-li:text-beige
              prose-img:rounded-xl prose-img:border prose-img:border-divider"
          />
        </article>

        <footer className="py-8 mt-8">
          <div className="h-px bg-gradient-to-r from-transparent via-simon-purple/20 to-transparent mb-6" />
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm text-beige-dim hover:text-simon-purple-light transition-colors duration-200"
            >
              <ArrowLeft className="size-4" />
              Back to BonsAI
            </Link>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-[family-name:var(--font-dm-sans)] text-sm text-simon-purple/70 hover:text-simon-purple-light transition-colors"
            >
              Read on therundown.ai
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

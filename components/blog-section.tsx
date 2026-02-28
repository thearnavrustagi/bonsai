"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Rss,
  ExternalLink,
  Newspaper,
  Link2,
  Sparkle,
  Zap,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { DevPulseCard } from "@/components/dev-pulse-card";

interface BlogPost {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
  type: "highlight" | "update";
}

interface RundownArticle {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
}

function decodeEntities(str: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#x27;": "'",
    "&#39;": "'",
    "&apos;": "'",
    "&#x2F;": "/",
    "&#47;": "/",
  };
  return str.replace(
    /&(?:amp|lt|gt|quot|apos|#x27|#39|#x2F|#47);/g,
    (match) => entities[match] || match
  );
}

function timeAgo(dateStr: string): string {
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/* ── Simon Willison Highlights (prominent cards) ── */

function SimonHighlights({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <Sparkle className="size-3 text-simon-purple/50" />
        <span
          className="font-[family-name:var(--font-dm-sans)] font-bold tracking-[0.15em] uppercase text-simon-purple/50"
          style={{ fontSize: "clamp(0.5rem, 0.45rem + 0.1vw, 0.5625rem)" }}
        >
          Highlights
        </span>
      </div>
      <div className="space-y-2.5">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.id}`}
            className="group relative block rounded-xl bg-simon-purple/6 border border-simon-purple/12 px-5 py-3.5 transition-all duration-200 hover:border-simon-purple/25 hover:bg-simon-purple/10"
          >
            <div className="absolute top-3.5 right-4 opacity-40 group-hover:opacity-70 transition-opacity">
              <BookOpen className="size-3.5 text-simon-purple-light" />
            </div>
            <p
              className="font-[family-name:var(--font-dm-sans)] font-bold text-warm-white group-hover:text-simon-purple-light transition-colors leading-snug pr-6"
              style={{ fontSize: "clamp(0.8125rem, 0.75rem + 0.15vw, 0.9375rem)" }}
            >
              {decodeEntities(post.title)}
            </p>
            <p
              className="font-[family-name:var(--font-lora)] text-beige-dim/50 mt-1.5 line-clamp-2 leading-relaxed"
              style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.1vw, 0.8125rem)" }}
            >
              {decodeEntities(post.snippet)}
            </p>
            <span
              className="font-[family-name:var(--font-dm-sans)] text-beige-dim/30 mt-2 block"
              style={{ fontSize: "clamp(0.5625rem, 0.5rem + 0.1vw, 0.625rem)" }}
            >
              {timeAgo(post.pubDate)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Simon Willison Updates (compact list) ── */

function SimonUpdates({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;
  return (
    <div className="mt-7">
      <div className="h-px bg-gradient-to-r from-transparent via-simon-purple/10 to-transparent mb-4" />
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <Link2 className="size-3 text-simon-purple/40" />
        <span
          className="font-[family-name:var(--font-dm-sans)] font-bold tracking-[0.15em] uppercase text-simon-purple/40"
          style={{ fontSize: "clamp(0.5rem, 0.45rem + 0.1vw, 0.5625rem)" }}
        >
          Latest Links
        </span>
      </div>
      <div>
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.id}`}
            className="group flex items-start justify-between gap-4 py-2.5 transition-colors duration-150 hover:bg-simon-purple/5 rounded-lg px-2 -mx-1"
          >
            <div className="flex-1 min-w-0">
              <p
                className="font-[family-name:var(--font-dm-sans)] font-medium text-beige/80 group-hover:text-simon-purple-light transition-colors leading-snug"
                style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.1vw, 0.8125rem)" }}
              >
                {decodeEntities(post.title)}
              </p>
            </div>
            <span className="font-[family-name:var(--font-dm-sans)] text-[10px] text-beige-dim/30 shrink-0 mt-0.5">
              {timeAgo(post.pubDate)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── The Rundown AI Section ── */

function RundownSection({
  articles,
  loading,
}: {
  articles: RundownArticle[];
  loading: boolean;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-simon-purple-dim/[0.04] via-transparent to-simon-purple-dim/[0.02] pointer-events-none" />

      <div className="relative py-1">
        <a
          href="https://www.therundown.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 mb-4 px-1"
        >
          <div className="w-[3px] h-4 rounded-full bg-simon-purple-dim" />
          <Newspaper className="size-3.5 text-simon-purple-light" />
          <h2 className="section-label text-simon-purple-light">
            The Rundown AI
          </h2>
          <ExternalLink className="size-3 text-simon-purple/30 group-hover:text-simon-purple-light transition-colors ml-1" />
        </a>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-24 w-full bg-surface rounded-xl" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-2.5 px-1">
                <Skeleton className="h-4 w-full bg-surface rounded-lg mb-1" />
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div>
            {/* Hero card */}
            <Link
              href={`/rundown/${articles[0].id}`}
              className="group relative block rounded-xl overflow-hidden border border-simon-purple-dim/15 mb-4 transition-all duration-200 hover:border-simon-purple/30 hover:shadow-[0_0_24px_rgba(109,40,217,0.06)]"
            >
              <div className="absolute inset-0 bg-simon-purple-dim/8 group-hover:bg-simon-purple-dim/12 transition-colors" />
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-simon-purple via-simon-purple-dim to-transparent" />

              <div className="relative px-5 py-4 pl-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-[family-name:var(--font-dm-sans)] font-bold text-warm-white group-hover:text-simon-purple-light transition-colors leading-snug"
                      style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.2vw, 1.0625rem)" }}
                    >
                      {decodeEntities(articles[0].title)}
                    </p>
                    <p
                      className="font-[family-name:var(--font-lora)] text-beige-dim/50 mt-2 line-clamp-2 leading-relaxed"
                      style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.1vw, 0.8125rem)" }}
                    >
                      {decodeEntities(articles[0].snippet)}
                    </p>
                  </div>
                  <div className="flex items-center justify-center size-8 rounded-lg bg-simon-purple/10 border border-simon-purple/15 shrink-0 mt-0.5">
                    <Zap className="size-3.5 text-simon-purple-light" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                  <span
                    className="font-[family-name:var(--font-dm-sans)] font-semibold tracking-wider uppercase text-simon-purple-light/50"
                    style={{ fontSize: "clamp(0.5rem, 0.45rem + 0.1vw, 0.5625rem)" }}
                  >
                    The Rundown
                  </span>
                  <span className="text-beige-dim/20">&middot;</span>
                  <span className="font-[family-name:var(--font-dm-sans)] text-[10px] text-beige-dim/30">
                    {timeAgo(articles[0].pubDate)}
                  </span>
                </div>
              </div>
            </Link>

            {/* Past issues list */}
            {articles.length > 1 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Clock className="size-3 text-simon-purple-dim/50" />
                  <span
                    className="font-[family-name:var(--font-dm-sans)] font-bold tracking-[0.15em] uppercase text-simon-purple-dim/50"
                    style={{ fontSize: "clamp(0.5rem, 0.45rem + 0.1vw, 0.5625rem)" }}
                  >
                    Past Headlines
                  </span>
                </div>
                <div className="space-y-0">
                  {articles.slice(1).map((article, i) => (
                    <Link
                      key={article.id}
                      href={`/rundown/${article.id}`}
                      className="group relative flex items-center justify-between gap-4 py-3 px-3 -mx-1 rounded-lg transition-all duration-150 hover:bg-simon-purple-dim/6"
                    >
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 rounded-full bg-simon-purple-light/40 group-hover:h-5 transition-all duration-200" />
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span
                          className="font-[family-name:var(--font-dm-sans)] text-beige-dim/20 shrink-0 tabular-nums w-4 text-right"
                          style={{ fontSize: "clamp(0.625rem, 0.575rem + 0.1vw, 0.6875rem)" }}
                        >
                          {i + 1}
                        </span>
                        <p
                          className="font-[family-name:var(--font-dm-sans)] font-medium text-beige/80 group-hover:text-simon-purple-light transition-colors leading-snug truncate"
                          style={{ fontSize: "clamp(0.78rem, 0.72rem + 0.12vw, 0.875rem)" }}
                        >
                          {decodeEntities(article.title)}
                        </p>
                      </div>
                      <span className="font-[family-name:var(--font-dm-sans)] text-[10px] text-beige-dim/30 shrink-0">
                        {timeAgo(article.pubDate)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── Main BlogSection (Engineering Tab) ── */

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [rundownArticles, setRundownArticles] = useState<RundownArticle[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [rundownLoading, setRundownLoading] = useState(true);

  useEffect(() => {
    async function fetchBlog() {
      try {
        const res = await fetch("/api/blog");
        const data = await res.json();
        setPosts(data.posts || []);
      } catch {
        setPosts([]);
      } finally {
        setBlogLoading(false);
      }
    }
    async function fetchRundown() {
      try {
        const res = await fetch(`/api/rundown?t=${Date.now()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        setRundownArticles((data.articles || []).slice(0, 8));
      } catch {
        setRundownArticles([]);
      } finally {
        setRundownLoading(false);
      }
    }
    fetchBlog();
    fetchRundown();
  }, []);

  const highlights = posts.filter((p) => p.type === "highlight").slice(0, 4);
  const updates = posts.filter((p) => p.type === "update").slice(0, 6);

  return (
    <section className="mt-2">
      {/* ── Dev Pulse (signature widget) ── */}
      <DevPulseCard />

      {/* ── Simon Willison's Blog ── */}
      <div className="mt-8">
        <a
          href="https://simonwillison.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 mb-4 px-1"
        >
          <div className="w-[3px] h-4 rounded-full bg-simon-purple" />
          <Rss className="size-3.5 text-simon-purple-light" />
          <h2 className="section-label text-simon-purple-light">
            Simon Willison&apos;s Blog
          </h2>
          <ExternalLink className="size-3 text-simon-purple/30 group-hover:text-simon-purple-light transition-colors ml-1" />
        </a>

        {/* Featured guide banner */}
        <a
          href="https://simonwillison.net/guides/agentic-engineering-patterns/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-xl bg-simon-purple/8 border border-simon-purple/15 px-5 py-3.5 mb-5 transition-all duration-200 hover:border-simon-purple/30 hover:bg-simon-purple/12"
        >
          <div className="flex items-center justify-center size-10 rounded-lg bg-simon-purple/12 border border-simon-purple/20 shrink-0">
            <BookOpen className="size-5 text-simon-purple-light" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-[family-name:var(--font-dm-sans)] text-sm font-bold text-warm-white truncate">
              Agentic Engineering Patterns
            </p>
            <p className="font-[family-name:var(--font-lora)] text-xs text-beige-dim/60 mt-0.5">
              Building software with coding agents
            </p>
          </div>
          <ArrowUpRight className="size-4 text-simon-purple/30 group-hover:text-simon-purple-light transition-colors shrink-0" />
        </a>

        {blogLoading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-20 w-full bg-surface rounded-xl" />
            <Skeleton className="h-20 w-full bg-surface rounded-xl" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-2 px-1">
                <Skeleton className="h-3.5 w-full bg-surface rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <SimonHighlights posts={highlights} />
            <SimonUpdates posts={updates} />
          </>
        )}
      </div>

      {/* ── Section divider ── */}
      <div className="section-divider" />

      {/* ── The Rundown AI ── */}
      <RundownSection articles={rundownArticles} loading={rundownLoading} />
    </section>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  RefreshCw,
  Newspaper,
  Zap,
  Clock,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Types ─── */

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketState: string;
}

interface BusinessArticle {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
  source: string;
  thumbnail: string;
}

interface RundownArticle {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
  thumbnail: string;
}

/* ─── Helpers ─── */

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

function formatPrice(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ─── Stock Ticker ─── */

function StockTicker({ quotes }: { quotes: StockQuote[] }) {
  if (quotes.length === 0) return null;

  const doubled = [...quotes, ...quotes];

  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] mb-5">
      <div className="stock-ticker-track flex gap-6 py-3 px-4">
        {doubled.map((q, i) => {
          const isUp = q.change >= 0;
          return (
            <div
              key={`${q.symbol}-${i}`}
              className="flex items-center gap-2 shrink-0"
            >
              <span className="font-[family-name:var(--font-dm-sans)] text-[11px] font-bold tracking-wider text-warm-white/80">
                {q.symbol}
              </span>
              <span className="font-[family-name:var(--font-dm-sans)] text-[11px] text-beige-dim/60 tabular-nums">
                ${formatPrice(q.price)}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 font-[family-name:var(--font-dm-sans)] text-[10px] font-semibold tabular-nums ${
                  isUp ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isUp ? (
                  <TrendingUp className="size-2.5" />
                ) : (
                  <TrendingDown className="size-2.5" />
                )}
                {isUp ? "+" : ""}
                {q.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Market Trends Card ─── */

function MarketTrendsCard({
  content,
  loading,
  onRefresh,
}: {
  content: string;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-emerald-500/15 mb-6">
      <div className="absolute inset-0 bg-surface" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-emerald-500/[0.02]" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
              <BarChart3 className="size-3.5 text-emerald-400" />
            </div>
            <h2
              className="font-[family-name:var(--font-dm-sans)] font-bold text-warm-white"
              style={{
                fontSize: "clamp(1rem, 0.9rem + 0.25vw, 1.25rem)",
              }}
            >
              Market Trends in AI
            </h2>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg text-emerald-400/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200 disabled:opacity-50 shrink-0"
            title="Refresh market trends"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-3.5 w-full bg-warm-white/[0.03] rounded" />
            <Skeleton className="h-3.5 w-[92%] bg-warm-white/[0.03] rounded" />
            <Skeleton className="h-3.5 w-[78%] bg-warm-white/[0.03] rounded" />
            <Skeleton className="h-3.5 w-[85%] bg-warm-white/[0.03] rounded" />
          </div>
        ) : content ? (
          <div className="relative">
            <div className="overflow-y-auto max-h-[320px] pr-2 emerald-scrollbar">
              <div
                className="font-[family-name:var(--font-dm-sans)] text-beige/65 leading-[1.75] prose prose-invert prose-sm max-w-none prose-strong:text-warm-white/90 prose-strong:font-semibold prose-p:m-0 prose-li:my-0.5 prose-h2:text-emerald-400/70 prose-h2:font-[family-name:var(--font-dm-sans)] prose-h2:text-[0.8rem] prose-h2:font-bold prose-h2:mt-3 prose-h2:mb-1.5 prose-h2:tracking-wide prose-ul:my-1"
                style={{
                  fontSize: "clamp(0.78rem, 0.72rem + 0.12vw, 0.875rem)",
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-2 h-6 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
          </div>
        ) : (
          <p
            className="font-[family-name:var(--font-lora)] text-beige-dim/30 italic"
            style={{
              fontSize: "clamp(0.78rem, 0.72rem + 0.12vw, 0.875rem)",
            }}
          >
            No market trend data available yet.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── TechCrunch News Section ─── */

function TechCrunchSection({ articles }: { articles: BusinessArticle[] }) {
  if (articles.length === 0) return null;

  const hero = articles[0];
  const rest = articles.slice(1);

  return (
    <div>
      <a
        href="https://techcrunch.com/category/artificial-intelligence/"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 mb-4 px-1"
      >
        <div className="w-[3px] h-4 rounded-full bg-emerald-500" />
        <TrendingUp className="size-3.5 text-emerald-400" />
        <h2 className="section-label text-emerald-400">AI Business News</h2>
        <ExternalLink className="size-3 text-emerald-500/30 group-hover:text-emerald-400 transition-colors ml-1" />
      </a>

      {/* Hero article with thumbnail */}
      <Link
        href={`/blog/techcrunch/${hero.id}`}
        className="group block rounded-xl overflow-hidden border border-emerald-500/15 mb-4 transition-all duration-200 hover:border-emerald-500/30 hover:shadow-[0_0_24px_rgba(52,211,153,0.06)]"
      >
        {hero.thumbnail && (
          <div className="relative w-full aspect-[2.4/1] overflow-hidden">
            <img
              src={hero.thumbnail}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
          </div>
        )}
        <div
          className={`px-5 py-4 ${hero.thumbnail ? "-mt-12 relative z-10" : "bg-emerald-500/8"}`}
        >
          <p
            className="font-[family-name:var(--font-dm-sans)] font-bold text-warm-white group-hover:text-emerald-400 transition-colors leading-snug"
            style={{
              fontSize: "clamp(0.875rem, 0.8rem + 0.2vw, 1.0625rem)",
            }}
          >
            {decodeEntities(hero.title)}
          </p>
          <p className="font-[family-name:var(--font-lora)] text-xs text-beige-dim/50 mt-1.5 line-clamp-2 leading-relaxed">
            {decodeEntities(hero.snippet)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-[family-name:var(--font-dm-sans)] text-[10px] font-semibold tracking-wider uppercase text-emerald-400/60">
              {hero.source}
            </span>
            <span className="text-beige-dim/20">&middot;</span>
            <span className="font-[family-name:var(--font-dm-sans)] text-[10px] text-beige-dim/35">
              {timeAgo(hero.pubDate)}
            </span>
          </div>
        </div>
      </Link>

      {/* Secondary articles with thumbnails */}
      {rest.slice(0, 2).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {rest.slice(0, 2).map((article) => (
            <Link
              key={article.id}
              href={`/blog/techcrunch/${article.id}`}
              className="group block rounded-xl overflow-hidden border border-emerald-500/10 transition-all duration-200 hover:border-emerald-500/25 hover:bg-emerald-500/5"
            >
              {article.thumbnail && (
                <div className="relative w-full aspect-[2/1] overflow-hidden">
                  <img
                    src={article.thumbnail}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                </div>
              )}
              <div
                className={`px-4 py-3 ${article.thumbnail ? "-mt-8 relative z-10" : ""}`}
              >
                <p
                  className="font-[family-name:var(--font-dm-sans)] font-semibold text-warm-white/90 group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2"
                  style={{
                    fontSize:
                      "clamp(0.78rem, 0.72rem + 0.12vw, 0.875rem)",
                  }}
                >
                  {decodeEntities(article.title)}
                </p>
                <span className="font-[family-name:var(--font-dm-sans)] text-[10px] text-beige-dim/35 mt-1.5 block">
                  {timeAgo(article.pubDate)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Compact list for remaining articles */}
      {rest.slice(2).map((article) => (
        <Link
          key={article.id}
          href={`/blog/techcrunch/${article.id}`}
          className="group flex items-start justify-between gap-4 py-3 transition-colors duration-150 hover:bg-emerald-500/5 rounded-lg px-2 -mx-1"
        >
          <div className="flex-1 min-w-0">
            <p className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium text-beige group-hover:text-emerald-400 transition-colors leading-snug">
              {decodeEntities(article.title)}
            </p>
          </div>
          <span className="font-[family-name:var(--font-dm-sans)] text-[10px] text-beige-dim/35 shrink-0 mt-0.5">
            {timeAgo(article.pubDate)}
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ─── Rundown Section ─── */

function RundownSection({
  articles,
  loading,
}: {
  articles: RundownArticle[];
  loading: boolean;
}) {
  return (
    <div className="relative">
      <a
        href="https://www.therundown.ai/"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 mb-4 px-1"
      >
        <div className="w-[3px] h-4 rounded-full bg-emerald-500" />
        <Newspaper className="size-3.5 text-emerald-400" />
        <h2 className="section-label text-emerald-400">The Rundown AI</h2>
        <ExternalLink className="size-3 text-emerald-500/30 group-hover:text-emerald-400 transition-colors ml-1" />
      </a>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-44 w-full bg-surface rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-12 w-full bg-surface rounded-lg"
            />
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div>
          {/* Hero card */}
          <Link
            href={`/rundown/${articles[0].id}`}
            className="group relative block rounded-xl overflow-hidden border border-emerald-500/15 mb-5 transition-all duration-200 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(52,211,153,0.07)]"
          >
            {articles[0].thumbnail ? (
              <div className="relative w-full aspect-[2.4/1] overflow-hidden">
                <img
                  src={articles[0].thumbnail}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-surface/30 to-transparent" />
              </div>
            ) : (
              <div className="relative w-full h-20 overflow-hidden bg-gradient-to-br from-emerald-500/[0.08] via-emerald-600/[0.04] to-transparent">
                <div className="absolute top-3 right-4 size-14 rounded-full bg-emerald-400/[0.06] blur-xl" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
              </div>
            )}

            <div
              className={`relative px-5 pb-4 pt-3 pl-6 ${articles[0].thumbnail ? "-mt-20 z-10" : ""}`}
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-emerald-400 via-emerald-500 to-transparent" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    className="font-[family-name:var(--font-dm-sans)] font-bold text-warm-white group-hover:text-emerald-400 transition-colors leading-snug"
                    style={{
                      fontSize:
                        "clamp(0.9375rem, 0.85rem + 0.22vw, 1.125rem)",
                    }}
                  >
                    {decodeEntities(articles[0].title)}
                  </p>
                  <p
                    className="font-[family-name:var(--font-lora)] text-beige-dim/45 mt-2 line-clamp-2 leading-relaxed"
                    style={{
                      fontSize:
                        "clamp(0.75rem, 0.7rem + 0.1vw, 0.8125rem)",
                    }}
                  >
                    {decodeEntities(articles[0].snippet)}
                  </p>
                </div>
                <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 shrink-0 mt-0.5 group-hover:bg-emerald-500/15 transition-colors">
                  <Zap className="size-3.5 text-emerald-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <span
                  className="font-[family-name:var(--font-dm-sans)] font-semibold tracking-wider uppercase text-emerald-400/50"
                  style={{
                    fontSize:
                      "clamp(0.5rem, 0.45rem + 0.1vw, 0.5625rem)",
                  }}
                >
                  The Rundown
                </span>
                <span className="text-beige-dim/20">&middot;</span>
                <span className="font-[family-name:var(--font-dm-sans)] text-[10px] text-beige-dim/30">
                  {timeAgo(articles[0].pubDate)}
                </span>
                <ArrowUpRight className="size-3 text-emerald-400/30 ml-auto group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
          </Link>

          {/* Past headlines */}
          {articles.length > 1 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <Clock className="size-3 text-emerald-500/40" />
                <span
                  className="font-[family-name:var(--font-dm-sans)] font-bold tracking-[0.15em] uppercase text-emerald-500/40"
                  style={{
                    fontSize:
                      "clamp(0.5rem, 0.45rem + 0.1vw, 0.5625rem)",
                  }}
                >
                  Past Headlines
                </span>
              </div>
              <div className="space-y-0.5">
                {articles.slice(1).map((article, i) => (
                  <Link
                    key={article.id}
                    href={`/rundown/${article.id}`}
                    className="group relative flex items-center justify-between gap-4 py-2.5 px-3 -mx-1 rounded-lg transition-all duration-150 hover:bg-emerald-500/[0.04]"
                  >
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 rounded-full bg-emerald-400/50 group-hover:h-5 transition-all duration-200" />
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span
                        className="font-[family-name:var(--font-dm-sans)] text-emerald-500/25 shrink-0 tabular-nums w-4 text-right"
                        style={{
                          fontSize:
                            "clamp(0.625rem, 0.575rem + 0.1vw, 0.6875rem)",
                        }}
                      >
                        {i + 1}
                      </span>
                      {article.thumbnail && (
                        <div className="relative w-11 h-8 rounded-md overflow-hidden shrink-0 border border-emerald-500/10">
                          <img
                            src={article.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <p
                        className="font-[family-name:var(--font-dm-sans)] font-medium text-beige/75 group-hover:text-emerald-400 transition-colors leading-snug truncate"
                        style={{
                          fontSize:
                            "clamp(0.78rem, 0.72rem + 0.12vw, 0.875rem)",
                        }}
                      >
                        {decodeEntities(article.title)}
                      </p>
                    </div>
                    <span className="font-[family-name:var(--font-dm-sans)] text-[10px] text-beige-dim/25 shrink-0">
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
  );
}

/* ─── Main BusinessSection ─── */

export function BusinessSection() {
  const [articles, setArticles] = useState<BusinessArticle[]>([]);
  const [rundownArticles, setRundownArticles] = useState<RundownArticle[]>([]);
  const [stockQuotes, setStockQuotes] = useState<StockQuote[]>([]);
  const [marketContent, setMarketContent] = useState("");
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [rundownLoading, setRundownLoading] = useState(true);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [marketLoading, setMarketLoading] = useState(true);

  const refreshMarketTrends = useCallback(async (refresh = false) => {
    setMarketLoading(true);
    try {
      const url = `/api/market-trends${refresh ? `?refresh=true&t=${Date.now()}` : ""}`;
      const res = await fetch(url, refresh ? { cache: "no-store" } : undefined);
      const data = await res.json();
      setMarketContent(data.content || "");
    } catch {
      setMarketContent("");
    } finally {
      setMarketLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/business");
        const data = await res.json();
        setArticles((data.articles || []).slice(0, 12));
      } catch {
        setArticles([]);
      } finally {
        setArticlesLoading(false);
      }
    };

    const fetchRundown = async () => {
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
    };

    const fetchStocks = async () => {
      try {
        const res = await fetch("/api/stocks");
        const data = await res.json();
        setStockQuotes(data.quotes || []);
      } catch {
        setStockQuotes([]);
      } finally {
        setStocksLoading(false);
      }
    };

    fetchArticles();
    fetchRundown();
    fetchStocks();
    refreshMarketTrends();
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <section className="mt-6">
      {/* 1. Stock Ticker */}
      {stocksLoading ? (
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] mb-5 px-4 py-3">
          <div className="flex gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-4 w-24 bg-emerald-500/[0.06] rounded shrink-0"
              />
            ))}
          </div>
        </div>
      ) : (
        <StockTicker quotes={stockQuotes} />
      )}

      {/* 2. Market Trends */}
      <MarketTrendsCard content={marketContent} loading={marketLoading} onRefresh={() => refreshMarketTrends(true)} />

      {/* 3. TechCrunch News */}
      {articlesLoading ? (
        <div className="space-y-1 mb-6">
          <Skeleton className="aspect-[2.4/1] w-full bg-surface rounded-xl mb-3" />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Skeleton className="aspect-[2/1.2] bg-surface rounded-xl" />
            <Skeleton className="aspect-[2/1.2] bg-surface rounded-xl" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="py-2.5 px-1">
              <Skeleton className="h-4 w-full bg-surface rounded-lg mb-1" />
              <Skeleton className="h-3 w-2/3 bg-surface rounded-lg" />
            </div>
          ))}
        </div>
      ) : articles.length > 0 ? (
        <TechCrunchSection articles={articles} />
      ) : (
        <div className="py-12 text-center">
          <p className="font-[family-name:var(--font-lora)] text-beige-dim/50 text-sm">
            No business news available right now.
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="section-divider" />

      {/* 4. The Rundown AI */}
      <RundownSection articles={rundownArticles} loading={rundownLoading} />
    </section>
  );
}

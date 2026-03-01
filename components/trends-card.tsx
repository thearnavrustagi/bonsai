"use client";

import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { type TopicId, getTopicLabel } from "@/lib/topics";

type Range = "day" | "week" | "month";

interface TrendsCardProps {
  topicId: TopicId;
  subtopicId: string;
}

export function TrendsCard({ topicId, subtopicId }: TrendsCardProps) {
  const [range, setRange] = useState<Range>("month");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTrends = useCallback(async (refresh = false) => {
    setLoading(true);
    try {
      const url = `/api/trends?topic=${topicId}&subtopic=${subtopicId}&range=${range}${refresh ? `&refresh=true&t=${Date.now()}` : ""}`;
      const res = await fetch(url, refresh ? { cache: "no-store" } : undefined);
      const data = await res.json();
      setContent(data.content || "");
    } catch {
      setContent("");
    } finally {
      setLoading(false);
    }
  }, [topicId, subtopicId, range]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const topicLabel = getTopicLabel(topicId);
  const ranges: { id: Range; label: string }[] = [
    { id: "day", label: "Today" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
  ];

  return (
    <div className="relative mt-6 rounded-2xl overflow-hidden border border-divider/30">
      <div className="absolute inset-0 bg-surface" />
      <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.04] via-transparent to-simon-purple/[0.03]" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gold/10 border border-gold/15">
              <TrendingUp className="size-3.5 text-gold" />
            </div>
            <h2
              className="font-[family-name:var(--font-playfair)] font-bold text-warm-white"
              style={{ fontSize: "clamp(1rem, 0.9rem + 0.25vw, 1.25rem)" }}
            >
              Current Trend in {topicLabel} Research
            </h2>
          </div>
          <button
            onClick={() => fetchTrends(true)}
            disabled={loading}
            className="p-1.5 rounded-lg text-gold/30 hover:text-gold hover:bg-gold/10 transition-all duration-200 disabled:opacity-50 shrink-0"
            title="Refresh trends"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Range toggles */}
        <div className="flex gap-1 mb-4">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`font-[family-name:var(--font-dm-sans)] font-semibold px-3 py-1 rounded-full transition-all duration-200 ${
                range === r.id
                  ? "bg-warm-white/10 text-warm-white border border-warm-white/15 shadow-[0_0_12px_rgba(255,253,248,0.04)]"
                  : "text-beige-dim/40 hover:text-beige-dim/70 border border-transparent"
              }`}
              style={{ fontSize: "clamp(0.6rem, 0.55rem + 0.1vw, 0.6875rem)" }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        {loading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-3.5 w-full bg-warm-white/[0.03] rounded" />
            <Skeleton className="h-3.5 w-[92%] bg-warm-white/[0.03] rounded" />
            <Skeleton className="h-3.5 w-[78%] bg-warm-white/[0.03] rounded" />
          </div>
        ) : content ? (
          <div className="relative">
            <div
              className="overflow-y-auto max-h-[280px] pr-2 trends-scrollbar"
            >
              <div
                className="font-[family-name:var(--font-dm-sans)] text-beige/65 leading-[1.75] prose prose-invert prose-sm max-w-none prose-strong:text-warm-white/90 prose-strong:font-semibold prose-p:m-0 prose-li:my-0.5 prose-h2:text-gold/70 prose-h2:font-[family-name:var(--font-dm-sans)] prose-h2:text-[0.8rem] prose-h2:font-bold prose-h2:mt-3 prose-h2:mb-1.5 prose-h2:tracking-wide prose-ul:my-1"
                style={{ fontSize: "clamp(0.78rem, 0.72rem + 0.12vw, 0.875rem)" }}
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
            style={{ fontSize: "clamp(0.78rem, 0.72rem + 0.12vw, 0.875rem)" }}
          >
            No trend data available yet.
          </p>
        )}
      </div>
    </div>
  );
}

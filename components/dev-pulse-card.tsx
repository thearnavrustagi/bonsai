"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Terminal, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DevPulseCard() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPulse() {
      try {
        const res = await fetch("/api/dev-pulse");
        const data = await res.json();
        setContent(data.content || "");
      } catch {
        setContent("");
      } finally {
        setLoading(false);
      }
    }
    fetchPulse();
  }, []);

  return (
    <div className="relative mt-6 rounded-2xl overflow-hidden border border-divider/30">
      <div className="absolute inset-0 bg-surface" />
      <div className="absolute inset-0 bg-gradient-to-br from-simon-purple/[0.04] via-transparent to-simon-purple/[0.03]" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-simon-purple/20 to-transparent" />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-simon-purple/10 border border-simon-purple/15">
              <Terminal className="size-3.5 text-simon-purple-light" />
            </div>
            <h2
              className="font-[family-name:var(--font-dm-sans)] font-bold text-warm-white"
              style={{ fontSize: "clamp(1rem, 0.9rem + 0.25vw, 1.25rem)" }}
            >
              Dev Pulse
            </h2>
          </div>
          <Sparkles className="size-3.5 text-simon-purple/30 shrink-0 mt-1" />
        </div>

        {loading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-3.5 w-full bg-simon-purple/[0.04] rounded" />
            <Skeleton className="h-3.5 w-[92%] bg-simon-purple/[0.04] rounded" />
            <Skeleton className="h-3.5 w-[78%] bg-simon-purple/[0.04] rounded" />
          </div>
        ) : content ? (
          <div className="relative">
            <div className="overflow-y-auto max-h-[280px] pr-2 purple-scrollbar">
              <div
                className="font-[family-name:var(--font-dm-sans)] text-beige/65 leading-[1.75] prose prose-invert prose-sm max-w-none prose-strong:text-warm-white/90 prose-strong:font-semibold prose-p:m-0 prose-li:my-0.5 prose-h2:text-simon-purple-light/70 prose-h2:font-[family-name:var(--font-dm-sans)] prose-h2:text-[0.8rem] prose-h2:font-bold prose-h2:mt-3 prose-h2:mb-1.5 prose-h2:tracking-wide prose-ul:my-1"
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
            className="font-[family-name:var(--font-dm-sans)] text-beige-dim/30 italic"
            style={{ fontSize: "clamp(0.78rem, 0.72rem + 0.12vw, 0.875rem)" }}
          >
            No engineering pulse data yet.
          </p>
        )}
      </div>
    </div>
  );
}

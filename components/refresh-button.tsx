"use client";

import { useState } from "react";
import { Newspaper, Loader2, Zap } from "lucide-react";

interface RefreshButtonProps {
  onComplete?: () => void;
  hasPapers?: boolean;
}

export function RefreshButton({
  onComplete,
  hasPapers = false,
}: RefreshButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFetch() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/fetch-papers?force=true", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        onComplete?.();
      } else {
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setMessage("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  if (!hasPapers && !loading && !message) {
    return (
      <div className="my-6">
        <div className="pulse-border rounded-2xl border-2 bg-surface p-8 sm:p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold/15 border border-gold/25 mb-5">
            <Zap className="size-6 text-gold" />
          </div>

          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-warm-white mb-2">
            Breaking: New Papers Dropped
          </h2>

          <p className="font-[family-name:var(--font-lora)] text-beige-dim/70 text-sm sm:text-base max-w-sm mx-auto mb-7 leading-relaxed">
            Today&apos;s top AI research papers are ready. Fetch and summarize
            them with one click.
          </p>

          <button
            onClick={handleFetch}
            className="inline-flex items-center gap-2.5 font-[family-name:var(--font-dm-sans)] text-sm font-bold tracking-wide px-7 py-3.5 rounded-full bg-gold text-background hover:bg-gold-dim transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,168,83,0.25)]"
          >
            <Newspaper className="size-4" />
            Fetch Today&apos;s Papers
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8">
        <Loader2 className="size-5 text-gold animate-spin" />
        <span className="font-[family-name:var(--font-dm-sans)] text-sm text-beige-dim">
          Preparing today&apos;s edition...
        </span>
      </div>
    );
  }

  if (message) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="font-[family-name:var(--font-lora)] text-sm text-beige-dim/60 italic">
          {message}
        </span>
      </div>
    );
  }

  return null;
}

"use client";

import { useEffect, useState, use } from "react";
import { PaperArticle } from "@/components/paper-article";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { PaperSummary } from "@/lib/types";

interface PaperPageProps {
  params: Promise<{ id: string }>;
}

export default function PaperPage({ params }: PaperPageProps) {
  const { id } = use(params);
  const [paper, setPaper] = useState<PaperSummary | null>(null);
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSummarizing(true), 3000);

    async function load() {
      try {
        const res = await fetch(`/api/papers/${id}`);
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = await res.json();
        setPaper(data.paper);
        setDate(data.date);
      } catch {
        setError(true);
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    }
    load();

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {summarizing && (
            <div className="mb-8 text-center">
              <p className="font-[family-name:var(--font-dm-sans)] text-sm text-beige-dim animate-pulse">
                Summarizing paper with AI — this may take up to a minute...
              </p>
            </div>
          )}
          <Skeleton className="h-4 w-32 bg-surface rounded-lg mb-10" />
          <div className="space-y-3 mb-8">
            <Skeleton className="h-5 w-48 bg-surface rounded-lg" />
            <Skeleton className="h-12 w-full bg-surface rounded-lg" />
            <Skeleton className="h-12 w-3/4 bg-surface rounded-lg" />
            <Skeleton className="h-4 w-64 bg-surface rounded-lg" />
          </div>
          <Skeleton className="h-32 w-full bg-surface rounded-xl mb-10" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full bg-surface rounded-lg" />
            <Skeleton className="h-4 w-full bg-surface rounded-lg" />
            <Skeleton className="h-4 w-3/4 bg-surface rounded-lg" />
            <Skeleton className="h-4 w-5/6 bg-surface rounded-lg" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !paper) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-warm-white mb-4">
            Paper not found
          </h1>
          <p className="font-[family-name:var(--font-lora)] text-beige-dim text-sm mb-8">
            This paper may have been removed or the link is incorrect.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm font-medium px-6 py-2.5 rounded-full border border-gold/20 text-gold hover:bg-gold/10 transition-all duration-300"
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
      <PaperArticle paper={paper} date={date} />
    </main>
  );
}

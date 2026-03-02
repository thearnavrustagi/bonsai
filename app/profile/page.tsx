"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  BookmarkX,
  FlaskConical,
  Wrench,
  TrendingUp,
  Newspaper,
} from "lucide-react";
import { useBookmarks, type Bookmark as BookmarkType } from "@/lib/use-bookmarks";

const typeConfig: Record<
  BookmarkType["type"],
  { label: string; icon: typeof FlaskConical; color: string; bgColor: string; borderColor: string }
> = {
  paper: {
    label: "Paper",
    icon: FlaskConical,
    color: "text-gold",
    bgColor: "bg-gold/10",
    borderColor: "border-gold/20",
  },
  blog: {
    label: "Blog",
    icon: Wrench,
    color: "text-simon-purple-light",
    bgColor: "bg-simon-purple/10",
    borderColor: "border-simon-purple/20",
  },
  techcrunch: {
    label: "TechCrunch",
    icon: TrendingUp,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  rundown: {
    label: "Rundown",
    icon: Newspaper,
    color: "text-simon-purple-light",
    bgColor: "bg-simon-purple/10",
    borderColor: "border-simon-purple/20",
  },
};

function formatSavedDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function ProfilePage() {
  const { bookmarks, removeBookmark } = useBookmarks();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      removeBookmark(id);
      setRemovingId(null);
    }, 300);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-beige-dim/70 hover:text-beige hover:bg-warm-white/5 transition-all duration-200"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex-1" />
        </div>

        <div className="mb-10">
          <h1
            className="font-[family-name:var(--font-playfair)] font-bold text-warm-white"
            style={{ fontSize: "clamp(1.75rem, 1.5rem + 0.5vw, 2.25rem)" }}
          >
            Your Library
          </h1>
          <p
            className="font-[family-name:var(--font-lora)] text-beige-dim/50 mt-1"
            style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.1vw, 0.875rem)" }}
          >
            {bookmarks.length === 0
              ? "Articles you bookmark will appear here"
              : `${bookmarks.length} saved article${bookmarks.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {/* Bookmarks */}
        {bookmarks.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-divider/60 flex items-center justify-center mb-6">
              <Bookmark className="size-7 text-beige-dim/30" />
            </div>
            <h2
              className="font-[family-name:var(--font-playfair)] font-bold text-warm-white/80 mb-2"
              style={{ fontSize: "clamp(1.1rem, 1rem + 0.2vw, 1.35rem)" }}
            >
              No bookmarks yet
            </h2>
            <p
              className="font-[family-name:var(--font-lora)] text-beige-dim/40 max-w-xs"
              style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.1vw, 0.875rem)" }}
            >
              When you find an article you want to revisit, tap the bookmark icon to save it here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((bookmark) => {
              const config = typeConfig[bookmark.type];
              const Icon = config.icon;
              const isRemoving = removingId === bookmark.id;

              return (
                <div
                  key={bookmark.id}
                  className={`group relative rounded-xl border border-divider/60 bg-surface hover:border-divider transition-all duration-300 ${
                    isRemoving ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                >
                  <Link
                    href={bookmark.url}
                    className="flex items-start gap-4 p-4 sm:p-5"
                  >
                    {/* Thumbnail or type icon */}
                    {bookmark.thumbnail ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-divider/40 shrink-0 bg-surface-hover">
                        <img
                          src={bookmark.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-lg ${config.bgColor} border ${config.borderColor} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`size-5 ${config.color}`} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-[family-name:var(--font-playfair)] font-bold text-warm-white leading-snug line-clamp-2 group-hover:text-beige transition-colors"
                        style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.15vw, 1rem)" }}
                      >
                        {bookmark.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`inline-flex items-center gap-1 font-[family-name:var(--font-dm-sans)] text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} border ${config.borderColor}`}
                        >
                          {config.label}
                        </span>
                        {bookmark.source && (
                          <span className="font-[family-name:var(--font-dm-sans)] text-[11px] text-beige-dim/40">
                            {bookmark.source}
                          </span>
                        )}
                        <span className="font-[family-name:var(--font-dm-sans)] text-[11px] text-beige-dim/30">
                          {formatSavedDate(bookmark.savedAt)}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(bookmark.id);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-beige-dim/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    aria-label="Remove bookmark"
                  >
                    <BookmarkX className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="py-8 mt-8">
          <div className="h-[2px] bg-gold/15" />
          <div className="h-[1px] bg-gold/8 mt-[2px]" />
          <p
            className="font-[family-name:var(--font-dm-sans)] font-bold tracking-[0.2em] uppercase text-beige-dim/35 mt-5 text-center"
            style={{ fontSize: "clamp(0.5625rem, 0.5rem + 0.1vw, 0.625rem)" }}
          >
            BonsAI
          </p>
        </footer>
      </div>
    </main>
  );
}

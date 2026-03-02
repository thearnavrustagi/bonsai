"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, BookmarkCheck, Share2, Check, User } from "lucide-react";
import type { Bookmark as BookmarkType } from "@/lib/use-bookmarks";

interface ArticleNavbarProps {
  accent?: "gold" | "purple" | "emerald";
  bookmarkItem?: Omit<BookmarkType, "savedAt">;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  shareTitle?: string;
}

const accentColors = {
  gold: {
    text: "text-gold",
    hoverBg: "hover:bg-gold/10",
    border: "border-gold/10",
    divider: "via-gold/15",
    progress: "from-gold to-[#A8863F]",
  },
  purple: {
    text: "text-simon-purple-light",
    hoverBg: "hover:bg-simon-purple/10",
    border: "border-simon-purple/10",
    divider: "via-simon-purple/15",
    progress: "from-simon-purple to-simon-purple-light",
  },
  emerald: {
    text: "text-emerald-400",
    hoverBg: "hover:bg-emerald-500/10",
    border: "border-emerald-500/10",
    divider: "via-emerald-500/15",
    progress: "from-emerald-500 to-emerald-400",
  },
};

export function ArticleNavbar({
  accent = "gold",
  bookmarkItem,
  isBookmarked = false,
  onToggleBookmark,
  shareTitle,
}: ArticleNavbarProps) {
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = shareTitle || document.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled share sheet
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard not available
      }
    }
  }, [shareTitle]);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        
        // Calculate progress
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(docHeight > 0 ? (currentY / docHeight) * 100 : 0);

        if (currentY < 60) {
          setVisible(true);
        } else if (currentY > lastScrollY.current + 5) {
          setVisible(false);
        } else if (currentY < lastScrollY.current - 5) {
          setVisible(true);
        }
        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const colors = accentColors[accent];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div 
        className="backdrop-blur-xl bg-background/80 border-b border-divider/40 relative"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div
          className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r ${colors.progress} transition-[width] duration-75 ease-linear z-10`}
          style={{ width: `${progress}%` }}
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between relative z-20">
          {/* Left: Back */}
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 font-[family-name:var(--font-dm-sans)] text-sm text-beige-dim/70 hover:text-beige transition-colors duration-200 -ml-1 px-2 py-1.5 rounded-lg ${colors.hoverBg}`}
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>

          {/* Center: BonsAI */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <span
              className="font-[family-name:var(--font-notable)] text-lg tracking-tight"
            >
              <span className="text-warm-white">BONS</span>
              <span className={colors.text}>AI</span>
            </span>
          </Link>

          {/* Right: Share + Bookmark + Profile */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
                copied
                  ? `${colors.text}`
                  : `text-beige-dim/50 hover:text-beige ${colors.hoverBg}`
              }`}
              aria-label={copied ? "Link copied" : "Share"}
            >
              {copied ? (
                <Check className="size-[18px]" />
              ) : (
                <Share2 className="size-[18px]" />
              )}
            </button>
            {bookmarkItem && onToggleBookmark && (
              <button
                onClick={onToggleBookmark}
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
                  isBookmarked
                    ? `${colors.text} bg-${accent === "gold" ? "gold" : accent === "purple" ? "simon-purple" : "emerald-500"}/10`
                    : `text-beige-dim/50 hover:text-beige ${colors.hoverBg}`
                }`}
                aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="size-[18px]" />
                ) : (
                  <Bookmark className="size-[18px]" />
                )}
              </button>
            )}
            <Link
              href="/profile"
              className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-beige-dim/50 hover:text-beige ${colors.hoverBg} transition-colors duration-200`}
              aria-label="Profile"
            >
              <User className="size-[18px]" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

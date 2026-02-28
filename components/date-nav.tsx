"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateNavProps {
  currentDate: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function DateNav({
  currentDate,
  availableDates,
  onDateChange,
}: DateNavProps) {
  const currentIndex = availableDates.indexOf(currentDate);
  const hasPrev = currentIndex < availableDates.length - 1;
  const hasNext = currentIndex > 0;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        disabled={!hasPrev}
        onClick={() => onDateChange(availableDates[currentIndex + 1])}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-divider/60 text-beige-dim hover:text-gold hover:border-gold/25 hover:bg-gold/5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-beige-dim disabled:hover:border-divider/60 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="size-4" />
      </button>

      <span className="font-[family-name:var(--font-dm-sans)] text-sm font-medium text-beige px-4 py-1.5 rounded-full bg-surface border border-divider/40 min-w-[100px] text-center">
        {formatShortDate(currentDate)}
      </span>

      <button
        disabled={!hasNext}
        onClick={() => onDateChange(availableDates[currentIndex - 1])}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-divider/60 text-beige-dim hover:text-gold hover:border-gold/25 hover:bg-gold/5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-beige-dim disabled:hover:border-divider/60 disabled:hover:bg-transparent"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

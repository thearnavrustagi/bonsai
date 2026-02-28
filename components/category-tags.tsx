"use client";

const ML_TAG_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  LLMs: { text: "text-tag-blue", bg: "bg-tag-blue-bg", border: "border-tag-blue-border" },
  Vision: { text: "text-tag-emerald", bg: "bg-tag-emerald-bg", border: "border-tag-emerald-border" },
  RL: { text: "text-tag-purple", bg: "bg-tag-purple-bg", border: "border-tag-purple-border" },
  Generative: { text: "text-tag-pink", bg: "bg-tag-pink-bg", border: "border-tag-pink-border" },
  Optimization: { text: "text-tag-amber", bg: "bg-tag-amber-bg", border: "border-tag-amber-border" },
  Graph: { text: "text-tag-cyan", bg: "bg-tag-cyan-bg", border: "border-tag-cyan-border" },
  Theory: { text: "text-beige-dim/70", bg: "bg-beige-dim/8", border: "border-beige-dim/20" },
  Systems: { text: "text-tag-amber", bg: "bg-tag-amber-bg", border: "border-tag-amber-border" },
  Data: { text: "text-tag-cyan", bg: "bg-tag-cyan-bg", border: "border-tag-cyan-border" },
  Other: { text: "text-beige-dim/60", bg: "bg-beige-dim/6", border: "border-beige-dim/15" },
};

const APP_TAG_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  Healthcare: { text: "text-tag-emerald/80", bg: "bg-tag-emerald-bg/60", border: "border-tag-emerald-border/60" },
  Robotics: { text: "text-tag-purple/80", bg: "bg-tag-purple-bg/60", border: "border-tag-purple-border/60" },
  Code: { text: "text-tag-blue/80", bg: "bg-tag-blue-bg/60", border: "border-tag-blue-border/60" },
  Science: { text: "text-tag-cyan/80", bg: "bg-tag-cyan-bg/60", border: "border-tag-cyan-border/60" },
  Education: { text: "text-tag-amber/80", bg: "bg-tag-amber-bg/60", border: "border-tag-amber-border/60" },
  Finance: { text: "text-tag-pink/80", bg: "bg-tag-pink-bg/60", border: "border-tag-pink-border/60" },
  NLP: { text: "text-tag-blue/80", bg: "bg-tag-blue-bg/60", border: "border-tag-blue-border/60" },
  Security: { text: "text-tag-amber/80", bg: "bg-tag-amber-bg/60", border: "border-tag-amber-border/60" },
  Retrieval: { text: "text-tag-cyan/80", bg: "bg-tag-cyan-bg/60", border: "border-tag-cyan-border/60" },
  General: { text: "text-beige-dim/60", bg: "bg-beige-dim/6", border: "border-beige-dim/15" },
};

function getTagStyle(tag: string, type: "ml" | "app") {
  const map = type === "ml" ? ML_TAG_STYLES : APP_TAG_STYLES;
  return map[tag] ?? { text: "text-beige-dim/60", bg: "bg-beige-dim/6", border: "border-beige-dim/15" };
}

interface FeedTagPillProps {
  label: string;
  type: "ml" | "app";
}

export function FeedTagPill({ label, type }: FeedTagPillProps) {
  const style = getTagStyle(label, type);
  return (
    <span
      className={`shrink-0 rounded-full font-[family-name:var(--font-dm-sans)] font-semibold tracking-wide ${style.bg} ${style.text} border ${style.border}`}
      style={{ fontSize: "clamp(0.5625rem, 0.5rem + 0.1vw, 0.625rem)", padding: "0.125rem 0.5rem" }}
    >
      {label}
    </span>
  );
}

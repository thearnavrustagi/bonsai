"use client";

import { motion } from "framer-motion";
import { Wrench, Briefcase } from "lucide-react";
import { TOPICS, type TopicId } from "@/lib/topics";
import type { Tab } from "./floating-nav";

const aiAccentColors: Record<Tab, string> = {
  research: "#D4A853",
  engineering: "#A78BFA",
  business: "#34D399",
};

const tabLabels: Record<Tab, { label: string; tagline: string }> = {
  research: { label: "", tagline: "" },
  engineering: { label: "Engineering", tagline: "Tools, agents & dev workflows" },
  business: { label: "Business", tagline: "Industry news & market moves" },
};

const tabIcons: Record<string, typeof Wrench> = {
  engineering: Wrench,
  business: Briefcase,
};

interface MastheadProps {
  date: string;
  selectedTopic: TopicId;
  onTopicChange: (topic: TopicId) => void;
  selectedSubtopic: string;
  onSubtopicChange: (subtopic: string) => void;
  activeTab?: Tab;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getVolumeIssue(dateStr: string): { volume: number; issue: number } {
  const base = new Date("2025-01-01T00:00:00");
  const current = new Date(dateStr + "T00:00:00");
  const diffDays = Math.floor(
    (current.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)
  );
  const issue = (diffDays % 365) + 1;
  return { volume: Math.floor(diffDays / 365) + 1, issue };
}

export function Masthead({
  date,
  selectedTopic,
  onTopicChange,
  selectedSubtopic,
  onSubtopicChange,
  activeTab = "research",
}: MastheadProps) {
  const { issue } = getVolumeIssue(date);
  const currentTopic = TOPICS.find((t) => t.id === selectedTopic);
  const subtopics = currentTopic?.subtopics ?? [];

  return (
    <header className="pt-6 pb-2">
      <h1 className="masthead-title text-center">
        <span className="text-warm-white">BONS</span>
        <motion.span
          animate={{ color: aiAccentColors[activeTab] }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          AI
        </motion.span>
      </h1>

      <div className="flex items-center justify-center gap-6 mt-3 mb-5">
        <time
          className="font-[family-name:var(--font-dm-sans)] font-medium tracking-[0.12em] uppercase text-beige-dim/60"
          style={{ fontSize: "clamp(0.6rem, 0.5rem + 0.2vw, 0.75rem)" }}
        >
          {formatDate(date)}
        </time>
        <span
          className="font-[family-name:var(--font-dm-sans)] font-bold tracking-wider text-beige-dim/50"
          style={{ fontSize: "clamp(0.6rem, 0.5rem + 0.2vw, 0.75rem)" }}
        >
          #{issue}
        </span>
      </div>

      {activeTab === "research" ? (
        <>
          {/* Topic pills - only on Research tab */}
          <div className="scroll-row-fade">
            <div className="scroll-row px-1">
              {TOPICS.map((topic) => {
                const isActive = topic.id === selectedTopic;
                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      onTopicChange(topic.id);
                      onSubtopicChange("everything");
                    }}
                    className={`shrink-0 rounded-full font-[family-name:var(--font-dm-sans)] font-semibold tracking-wide transition-all duration-200 ${
                      isActive
                        ? "bg-gold text-background"
                        : "border border-divider text-beige-dim/60 hover:text-beige hover:border-beige-dim/40"
                    }`}
                    style={{ fontSize: "clamp(0.65rem, 0.55rem + 0.2vw, 0.8rem)", padding: "0.375rem 0.875rem" }}
                  >
                    {topic.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtopic text buttons */}
          <div className="scroll-row-fade mt-3">
            <div className="scroll-row gap-4 px-1">
              {subtopics.map((sub) => {
                const isActive = sub.id === selectedSubtopic;
                return (
                  <button
                    key={sub.id}
                    onClick={() => onSubtopicChange(sub.id)}
                    className={`shrink-0 font-[family-name:var(--font-lora)] font-medium transition-all duration-200 pb-0.5 ${
                      isActive
                        ? "text-warm-white border-b-2 border-gold"
                        : "text-beige-dim/50 hover:text-beige border-b-2 border-transparent"
                    }`}
                    style={{ fontSize: "clamp(0.75rem, 0.65rem + 0.2vw, 0.875rem)" }}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Section banner for Engineering / Business tabs */
        (() => {
          const info = tabLabels[activeTab];
          const Icon = tabIcons[activeTab];
          const color = activeTab === "engineering" ? "simon-purple" : "emerald-400";
          const colorLight = activeTab === "engineering" ? "simon-purple-light" : "emerald-400";
          return (
            <div className="flex items-center gap-3 px-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-lg bg-${color}/10 border border-${color}/15`}
              >
                {Icon && <Icon className={`size-4 text-${colorLight}`} />}
              </div>
              <div>
                <h2
                  className={`font-[family-name:var(--font-playfair)] font-bold text-${colorLight}`}
                  style={{ fontSize: "clamp(1rem, 0.9rem + 0.25vw, 1.25rem)" }}
                >
                  {info.label}
                </h2>
                <p
                  className="font-[family-name:var(--font-dm-sans)] text-beige-dim/40"
                  style={{ fontSize: "clamp(0.6rem, 0.55rem + 0.1vw, 0.6875rem)" }}
                >
                  {info.tagline}
                </p>
              </div>
            </div>
          );
        })()
      )}
    </header>
  );
}

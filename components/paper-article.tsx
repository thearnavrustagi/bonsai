"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink, FileDown } from "lucide-react";
import { MarkdownContent, MermaidBlock } from "@/components/markdown-content";
import { PdfPageViewer } from "@/components/pdf-figure";
import type { PaperSummary } from "@/lib/types";

function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return /\.(mp4|webm|mov|ogg)(\?|$)/.test(lower);
}

function HeroMedia({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;

  const primaryUrl = urls[0];

  if (isVideoUrl(primaryUrl)) {
    return (
      <figure className="my-10 rounded-xl overflow-hidden border border-divider/60 bg-surface/40">
        <video
          src={primaryUrl}
          controls
          playsInline
          muted
          autoPlay
          loop
          className="w-full"
        />
      </figure>
    );
  }

  return (
    <figure className="my-10 rounded-xl overflow-hidden border border-divider/60 bg-surface/40">
      <Image
        src={primaryUrl}
        alt="Paper illustration"
        width={1200}
        height={675}
        className="w-full h-auto"
        priority
      />
    </figure>
  );
}

interface PaperArticleProps {
  paper: PaperSummary;
  date: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const SECTIONS = [
  { id: "tldr", label: "TL;DR" },
  { id: "big-picture", label: "The Big Picture" },
  { id: "key-findings", label: "Key Findings" },
  { id: "technical", label: "Technical Deep Dive" },
  { id: "diagrams", label: "Diagrams" },
  { id: "figures", label: "Figures" },
] as const;

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="reading-progress-bar" style={{ width: `${progress}%` }} />
  );
}

function TableOfContents({
  paper,
  activeId,
}: {
  paper: PaperSummary;
  activeId: string;
}) {
  const visibleSections = SECTIONS.filter((s) => {
    if (s.id === "diagrams")
      return paper.mermaidDiagrams && paper.mermaidDiagrams.length > 0;
    if (s.id === "figures") return paper.diagrams && paper.diagrams.length > 0;
    return true;
  });

  return (
    <nav className="hidden xl:block fixed left-[max(1rem,calc((100vw-56rem)/2-14rem))] top-1/2 -translate-y-1/2 w-40">
      <ul className="space-y-1">
        {visibleSections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`block py-1.5 px-3 text-xs font-[family-name:var(--font-dm-sans)] rounded-md transition-all duration-200 ${
                activeId === section.id
                  ? "text-gold bg-gold/10 font-medium"
                  : "text-beige-dim/60 hover:text-beige-dim hover:bg-surface-hover"
              }`}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SectionOrnament() {
  return (
    <div className="flex items-center justify-center gap-2 my-12">
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/20" />
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        className="text-gold/30"
        fill="currentColor"
      >
        <path d="M6 0L7.41 4.59L12 6L7.41 7.41L6 12L4.59 7.41L0 6L4.59 4.59L6 0Z" />
      </svg>
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/20" />
    </div>
  );
}

export function PaperArticle({ paper, date }: PaperArticleProps) {
  const [activeSection, setActiveSection] = useState("tldr");

  const handleScroll = useCallback(() => {
    const sectionIds = SECTIONS.map((s) => s.id);
    let current = sectionIds[0];
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 150) current = id;
      }
    }
    setActiveSection(current);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const hasMermaid =
    paper.mermaidDiagrams && paper.mermaidDiagrams.length > 0;
  const hasFigures = paper.diagrams && paper.diagrams.length > 0;

  return (
    <>
      <ReadingProgress />
      <TableOfContents paper={paper} activeId={activeSection} />

      <article className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
        {/* Back nav */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm text-beige-dim hover:text-gold transition-colors duration-200 mb-10 group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
          Back to all papers
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <span className="font-[family-name:var(--font-dm-sans)] text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">
              {paper.upvotes} upvotes
            </span>
            <span className="font-[family-name:var(--font-dm-sans)] text-xs text-beige-dim">
              {formatDate(date)}
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl font-black text-warm-white leading-[1.15] mb-6">
            {paper.title}
          </h1>

          <p className="font-[family-name:var(--font-lora)] text-beige-dim text-sm leading-relaxed">
            {paper.authors.join(", ")}
          </p>

          <div className="mt-8 space-y-1">
            <div className="h-px bg-gradient-to-r from-beige/20 via-gold/30 to-beige/20" />
            <div className="h-[2px] bg-gradient-to-r from-beige/10 via-gold/20 to-beige/10" />
          </div>

          {paper.mediaUrls && paper.mediaUrls.length > 0 && (
            <HeroMedia urls={paper.mediaUrls} />
          )}
        </header>

        {/* TL;DR */}
        <section id="tldr" className="mb-12 scroll-mt-8">
          <div className="rounded-xl bg-surface border border-divider/60 overflow-hidden">
            <div className="border-l-[3px] border-gold/50 p-6 sm:p-8">
              <p className="font-[family-name:var(--font-dm-sans)] text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70 mb-3">
                TL;DR
              </p>
              <div className="font-[family-name:var(--font-lora)] text-beige text-base sm:text-lg leading-relaxed italic">
                <MarkdownContent content={paper.tldr} />
              </div>
            </div>
          </div>
        </section>

        <SectionOrnament />

        {/* The Big Picture */}
        <section id="big-picture" className="mb-14 scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-warm-white">
              The Big Picture
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-divider to-transparent" />
          </div>
          <div className="max-w-3xl">
            <MarkdownContent content={paper.summary} dropcap />
          </div>
        </section>

        <SectionOrnament />

        {/* Key Findings */}
        <section id="key-findings" className="mb-14 scroll-mt-8">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-warm-white">
              Key Findings
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-divider to-transparent" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {paper.keyFindings.map((finding, i) => (
              <div
                key={i}
                className="group relative rounded-xl bg-surface/60 border border-divider/40 p-5 sm:p-6 hover:border-gold/20 transition-all duration-300"
              >
                <div className="absolute top-4 right-4 font-[family-name:var(--font-playfair)] text-4xl font-black text-gold/[0.07] select-none leading-none">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <span className="inline-block font-[family-name:var(--font-playfair)] text-sm font-bold text-gold/40 mb-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="font-[family-name:var(--font-lora)] text-beige/85 text-[15px] leading-relaxed [&>p]:mb-0">
                  <MarkdownContent content={finding} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <SectionOrnament />

        {/* Technical Deep Dive */}
        <section id="technical" className="mb-14 scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-warm-white">
              Technical Deep Dive
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-divider to-transparent" />
          </div>
          <div className="rounded-xl border border-divider/60 bg-surface/30 p-6 sm:p-8">
            <MarkdownContent content={paper.technicalDetails} />
          </div>
        </section>

        {/* Mermaid Diagrams */}
        {hasMermaid && (
          <>
            <SectionOrnament />
            <section id="diagrams" className="mb-14 scroll-mt-8">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-warm-white">
                  Architecture & Flow
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-divider to-transparent" />
              </div>
              <div className="space-y-6">
                {paper.mermaidDiagrams!.map((diagram, i) => (
                  <MermaidBlock
                    key={i}
                    title={diagram.title}
                    code={diagram.code}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Figures from Paper */}
        {hasFigures && (
          <>
            <SectionOrnament />
            <section id="figures" className="mb-14 scroll-mt-8">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-warm-white">
                  Figures from Paper
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-divider to-transparent" />
              </div>
              <div className="space-y-6">
                {paper.diagrams.map((diagram, i) =>
                  diagram.pageNumber > 0 ? (
                    <PdfPageViewer
                      key={i}
                      pdfUrl={paper.pdfUrl}
                      pageNumber={diagram.pageNumber}
                      figureLabel={diagram.figureNumber}
                      description={diagram.description}
                      arxivUrl={paper.arxivUrl}
                    />
                  ) : (
                    <div
                      key={i}
                      className="rounded-xl bg-surface/60 border border-divider/40 overflow-hidden"
                    >
                      <div className="px-4 py-3 flex items-center gap-2 border-b border-divider/30">
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 group/link"
                        >
                          <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-gold/10 border border-gold/20 font-[family-name:var(--font-dm-sans)] text-[10px] font-semibold text-gold uppercase tracking-wider group-hover/link:bg-gold/20 transition-colors">
                            {diagram.figureNumber}
                          </span>
                          <ExternalLink className="size-2.5 text-beige-dim/30 group-hover/link:text-gold/60 transition-colors" />
                        </a>
                      </div>
                      <div className="px-4 py-3">
                        <p className="font-[family-name:var(--font-lora)] text-beige/65 text-sm leading-relaxed">
                          {diagram.description}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          </>
        )}

        {/* Footer */}
        <div className="h-px bg-gradient-to-r from-transparent via-divider to-transparent mb-8" />

        <footer className="flex flex-wrap gap-3 mb-12">
          <a
            href={paper.arxivUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm font-medium px-5 py-2.5 rounded-full border border-gold/20 text-gold hover:bg-gold/10 hover:border-gold/35 transition-all duration-300"
          >
            <ExternalLink className="size-3.5" />
            View on arXiv
          </a>
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm font-medium px-5 py-2.5 rounded-full border border-beige/15 text-beige-dim hover:text-beige hover:border-beige/30 transition-all duration-300"
          >
            <FileDown className="size-3.5" />
            Download PDF
          </a>
        </footer>
      </article>
    </>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  Loader2,
  Check,
  ArrowUpRight,
  Download,
  Search,
  Pin,
  PinOff,
} from "lucide-react";
import {
  getSubtopicsForTopic,
  getArxivCategoriesForSubtopic,
  type TopicId,
} from "@/lib/topics";

interface BrowsePaper {
  id: string;
  title: string;
  authors: string[];
  upvotes: number;
  publishedAt: string;
  imported: boolean;
  thumbnail?: string;
}

interface ArxivBrowsePaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  arxivUrl: string;
}

type TimeRange = "today" | "week";
type SourceTab = "huggingface" | "arxiv";

const PINNED_KEY = "daily-hugs-pinned";

function loadPinned(): Set<string> {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function savePinned(ids: Set<string>) {
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

interface BrowsePapersModalProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  currentTopicId: TopicId;
  currentSubtopicId: string;
}

export function BrowsePapersModal({
  open,
  onClose,
  onImportComplete,
  currentTopicId,
  currentSubtopicId,
}: BrowsePapersModalProps) {
  const [papers, setPapers] = useState<BrowsePaper[]>([]);
  const [arxivPapers, setArxivPapers] = useState<ArxivBrowsePaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<TimeRange>("today");
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [sourceTab, setSourceTab] = useState<SourceTab>("huggingface");
  const [arxivSubtopic, setArxivSubtopic] = useState(
    currentSubtopicId === "everything"
      ? getSubtopicsForTopic(currentTopicId)[1]?.id || "everything"
      : currentSubtopicId
  );

  useEffect(() => {
    setPinned(loadPinned());
  }, []);

  useEffect(() => {
    if (open) {
      setArxivSubtopic(
        currentSubtopicId === "everything"
          ? getSubtopicsForTopic(currentTopicId)[1]?.id || "everything"
          : currentSubtopicId
      );
    }
  }, [open, currentTopicId, currentSubtopicId]);

  const fetchHFPapers = useCallback(
    async (r: TimeRange) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/browse-papers?range=${r}`);
        const data = await res.json();
        setPapers(data.papers || []);
      } catch {
        setPapers([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchArxivBrowse = useCallback(
    async (subtopicId: string) => {
      setLoading(true);
      try {
        const cats = getArxivCategoriesForSubtopic(currentTopicId, subtopicId);
        if (cats.length === 0) {
          setArxivPapers([]);
          setLoading(false);
          return;
        }
        const res = await fetch(
          `/api/arxiv-papers?categories=${cats.join(",")}&maxResults=30`
        );
        const data = await res.json();
        setArxivPapers(data.papers || []);
      } catch {
        setArxivPapers([]);
      } finally {
        setLoading(false);
      }
    },
    [currentTopicId]
  );

  useEffect(() => {
    if (!open) return;
    if (sourceTab === "huggingface") {
      fetchHFPapers(range);
    } else {
      fetchArxivBrowse(arxivSubtopic);
    }
  }, [open, sourceTab, range, arxivSubtopic, fetchHFPapers, fetchArxivBrowse]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function togglePin(id: string) {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      savePinned(next);
      return next;
    });
  }

  async function handleImport(paperId: string) {
    setImportingId(paperId);
    try {
      const res = await fetch("/api/import-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId }),
      });

      if (res.ok) {
        if (sourceTab === "huggingface") {
          setPapers((prev) =>
            prev.map((p) => (p.id === paperId ? { ...p, imported: true } : p))
          );
        }
        onImportComplete();
      }
    } catch {
      // silently fail
    } finally {
      setImportingId(null);
    }
  }

  if (!open) return null;

  const subtopicsForArxiv = getSubtopicsForTopic(currentTopicId).filter(
    (s) => s.id !== "everything"
  );

  // HuggingFace filtered list
  const hfFiltered = search.trim()
    ? papers.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.authors.some((a) =>
            a.toLowerCase().includes(search.toLowerCase())
          )
      )
    : papers;

  const pinnedPapers = hfFiltered.filter((p) => pinned.has(p.id));
  const unpinnedPapers = hfFiltered.filter((p) => !pinned.has(p.id));
  const hfSorted = [...pinnedPapers, ...unpinnedPapers];

  // arXiv filtered list
  const arxivFiltered = search.trim()
    ? arxivPapers.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.authors.some((a) =>
            a.toLowerCase().includes(search.toLowerCase())
          )
      )
    : arxivPapers;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="modal-content relative w-full max-w-2xl max-h-[85vh] bg-background border border-divider rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-divider">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-[family-name:var(--font-dm-sans)] text-lg font-bold text-warm-white">
                Browse Papers
              </h2>
              <p className="font-[family-name:var(--font-dm-sans)] text-[11px] text-beige-dim/50 mt-0.5">
                {sourceTab === "huggingface"
                  ? `HuggingFace Daily Papers \u00B7 ${papers.length} available`
                  : `arXiv Papers \u00B7 ${arxivPapers.length} available`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-hover transition-colors text-beige-dim hover:text-warm-white -mt-1"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Source tabs */}
          <div className="flex gap-4 mb-3">
            <button
              onClick={() => setSourceTab("huggingface")}
              className={`font-[family-name:var(--font-dm-sans)] text-sm font-medium pb-1 transition-all duration-200 ${
                sourceTab === "huggingface"
                  ? "text-warm-white border-b-2 border-gold"
                  : "text-beige-dim/50 hover:text-beige border-b-2 border-transparent"
              }`}
            >
              HuggingFace
            </button>
            <button
              onClick={() => setSourceTab("arxiv")}
              className={`font-[family-name:var(--font-dm-sans)] text-sm font-medium pb-1 transition-all duration-200 ${
                sourceTab === "arxiv"
                  ? "text-warm-white border-b-2 border-gold"
                  : "text-beige-dim/50 hover:text-beige border-b-2 border-transparent"
              }`}
            >
              arXiv
            </button>
          </div>

          {/* HuggingFace time range OR arXiv subtopic pills */}
          {sourceTab === "huggingface" ? (
            <div className="flex gap-1.5">
              <button
                onClick={() => setRange("today")}
                className={`font-[family-name:var(--font-dm-sans)] text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                  range === "today"
                    ? "bg-gold text-background"
                    : "text-beige-dim/60 hover:text-beige hover:bg-surface"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setRange("week")}
                className={`font-[family-name:var(--font-dm-sans)] text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                  range === "week"
                    ? "bg-gold text-background"
                    : "text-beige-dim/60 hover:text-beige hover:bg-surface"
                }`}
              >
                This Week
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {subtopicsForArxiv.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setArxivSubtopic(sub.id)}
                  className={`font-[family-name:var(--font-dm-sans)] text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 ${
                    arxivSubtopic === sub.id
                      ? "bg-gold text-background"
                      : "text-beige-dim/60 hover:text-beige hover:bg-surface border border-divider/60"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-divider/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-beige-dim/40" />
            <input
              type="text"
              placeholder="Search papers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-divider/60 rounded-lg font-[family-name:var(--font-dm-sans)] text-sm text-beige placeholder:text-beige-dim/40 focus:outline-none focus:border-gold/30 transition-colors"
            />
          </div>
        </div>

        {/* Paper list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-5 text-gold animate-spin" />
              <span className="ml-2 font-[family-name:var(--font-dm-sans)] text-sm text-beige-dim">
                Loading papers...
              </span>
            </div>
          ) : sourceTab === "huggingface" ? (
            /* HuggingFace paper list */
            hfSorted.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-[family-name:var(--font-dm-sans)] text-sm text-beige-dim/60">
                  {search ? "No papers match your search" : "No papers available"}
                </p>
              </div>
            ) : (
              <div>
                {pinnedPapers.length > 0 && (
                  <div className="px-5 pt-3 pb-1">
                    <span className="font-[family-name:var(--font-dm-sans)] text-[10px] font-bold tracking-[0.15em] uppercase text-gold/60">
                      Saved &middot; {pinnedPapers.length}
                    </span>
                  </div>
                )}

                {hfSorted.map((paper, i) => {
                  const isPinned = pinned.has(paper.id);
                  const showDivider =
                    !isPinned &&
                    i === pinnedPapers.length &&
                    pinnedPapers.length > 0;

                  return (
                    <div key={paper.id}>
                      {showDivider && (
                        <div className="mx-5 my-1 h-[1px] bg-gold/15" />
                      )}
                      <div
                        className={`flex items-start gap-3 px-5 py-3.5 border-b border-divider/30 hover:bg-surface/50 transition-colors ${
                          isPinned ? "bg-gold/[0.03]" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-[family-name:var(--font-dm-sans)] text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-gold/10 text-gold/80 border border-gold/15">
                              {paper.upvotes}
                            </span>
                            {paper.imported && (
                              <span className="font-[family-name:var(--font-dm-sans)] text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-green-500/10 text-green-400/70 border border-green-500/15">
                                Imported
                              </span>
                            )}
                            {isPinned && (
                              <span className="font-[family-name:var(--font-dm-sans)] text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-gold/8 text-gold/60">
                                Saved
                              </span>
                            )}
                          </div>
                          <h3 className="font-[family-name:var(--font-dm-sans)] text-[13px] font-semibold text-warm-white leading-snug mb-1">
                            {paper.title}
                          </h3>
                          <p className="font-[family-name:var(--font-dm-sans)] text-[11px] text-beige-dim/45 line-clamp-1">
                            {paper.authors.slice(0, 4).join(", ")}
                            {paper.authors.length > 4 &&
                              ` +${paper.authors.length - 4} more`}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 pt-1">
                          <button
                            onClick={() => togglePin(paper.id)}
                            className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                              isPinned
                                ? "border-gold/30 bg-gold/10 text-gold"
                                : "border-divider/50 text-beige-dim/30 hover:text-gold/60 hover:border-gold/20"
                            }`}
                            title={isPinned ? "Unsave" : "Save for later"}
                          >
                            {isPinned ? (
                              <PinOff className="size-3.5" />
                            ) : (
                              <Pin className="size-3.5" />
                            )}
                          </button>
                          <a
                            href={`https://arxiv.org/abs/${paper.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-8 h-8 rounded-lg border border-divider/50 text-beige-dim/30 hover:text-beige hover:border-divider transition-colors"
                          >
                            <ArrowUpRight className="size-3.5" />
                          </a>
                          {paper.imported ? (
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 text-green-400/60">
                              <Check className="size-3.5" />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleImport(paper.id)}
                              disabled={importingId !== null}
                              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gold/20 text-gold/50 hover:bg-gold/10 hover:text-gold hover:border-gold/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {importingId === paper.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Download className="size-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* arXiv paper list */
            arxivFiltered.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-[family-name:var(--font-dm-sans)] text-sm text-beige-dim/60">
                  {search ? "No papers match your search" : "No papers available"}
                </p>
              </div>
            ) : (
              <div>
                {arxivFiltered.map((paper) => (
                  <div
                    key={paper.id}
                    className="flex items-start gap-3 px-5 py-3.5 border-b border-divider/30 hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-[family-name:var(--font-dm-sans)] text-[13px] font-semibold text-warm-white leading-snug mb-1">
                        {paper.title}
                      </h3>
                      <p className="font-[family-name:var(--font-dm-sans)] text-[11px] text-beige-dim/45 line-clamp-1 mb-1">
                        {paper.authors.slice(0, 4).join(", ")}
                        {paper.authors.length > 4 &&
                          ` +${paper.authors.length - 4} more`}
                      </p>
                      <p className="font-[family-name:var(--font-lora)] text-[11px] text-beige-dim/40 line-clamp-2">
                        {paper.abstract}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-1">
                      <a
                        href={paper.arxivUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-divider/50 text-beige-dim/30 hover:text-beige hover:border-divider transition-colors"
                      >
                        <ArrowUpRight className="size-3.5" />
                      </a>
                      <button
                        onClick={() => handleImport(paper.id)}
                        disabled={importingId !== null}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-gold/20 text-gold/50 hover:bg-gold/10 hover:text-gold hover:border-gold/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {importingId === paper.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Download className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Library, ArrowRight } from "lucide-react";
import { Masthead } from "@/components/masthead";
import { BlogSection } from "@/components/blog-section";
import { BusinessSection } from "@/components/business-section";
import { PaperCard } from "@/components/paper-card";
import { BrowsePapersModal } from "@/components/browse-papers-modal";
import { TrendsCard } from "@/components/trends-card";
import { FloatingNav, type Tab } from "@/components/floating-nav";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeedPaper } from "@/lib/types";
import type { TopicId } from "@/lib/topics";

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function Home() {
  const [papers, setPapers] = useState<FeedPaper[]>([]);
  const [date] = useState(todayDate());
  const [loading, setLoading] = useState(true);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicId>("ai");
  const [selectedSubtopic, setSelectedSubtopic] = useState("everything");
  const [activeTab, setActiveTab] = useState<Tab>("research");

  const fetchFeed = useCallback(async (topic: TopicId, subtopic: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feed?topic=${topic}&subtopic=${subtopic}`);
      const data = await res.json();
      const feedPapers: FeedPaper[] = data.papers || [];
      setPapers(feedPapers);

      if (feedPapers.length > 0) {
        fetch("/api/warm-papers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperIds: feedPapers.map((p) => p.id) }),
        }).catch(() => {});
      }
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(selectedTopic, selectedSubtopic);
  }, [selectedTopic, selectedSubtopic, fetchFeed]);

  const heroPaper = papers[0];
  const secondaryPapers = papers.slice(1, 3);
  const compactPapers = papers.slice(3);

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Masthead */}
        <Masthead
          date={date}
          selectedTopic={selectedTopic}
          onTopicChange={setSelectedTopic}
          selectedSubtopic={selectedSubtopic}
          onSubtopicChange={setSelectedSubtopic}
          activeTab={activeTab}
        />

        {/* Research Tab */}
        {activeTab === "research" && (
          <>
            {/* Trends Card */}
            <TrendsCard
              topicId={selectedTopic}
              subtopicId={selectedSubtopic}
            />

            {/* Papers Section */}
            <section className="mt-6">
              <div className="mb-5 flex items-center justify-end py-3">
                <button
                  onClick={() => setBrowseOpen(true)}
                  className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] font-semibold tracking-wider uppercase text-lg px-5 py-2.5 rounded-full bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 hover:border-gold/35 transition-all duration-200"
                >
                  <Plus className="size-5" />
                  <span>Add Papers</span>
                </button>
              </div>

              {loading ? (
                <div className="space-y-4 mt-2">
                  <Skeleton className="aspect-[2/1] w-full bg-surface rounded-2xl" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="aspect-[4/3] bg-surface rounded-xl" />
                    <Skeleton className="aspect-[4/3] bg-surface rounded-xl" />
                  </div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 py-3 px-3">
                      <Skeleton className="h-7 w-8 bg-surface rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full bg-surface rounded-lg" />
                        <Skeleton className="h-3 w-3/4 bg-surface rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : papers.length > 0 ? (
                <div className="space-y-4">
                  {heroPaper && (
                    <PaperCard paper={heroPaper} index={0} variant="hero" />
                  )}

                  {secondaryPapers.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {secondaryPapers.map((paper, i) => (
                        <PaperCard
                          key={paper.id}
                          paper={paper}
                          index={i + 1}
                          variant="secondary"
                        />
                      ))}
                    </div>
                  )}

                  {compactPapers.length > 0 && (
                    <div className="mt-2">
                      {compactPapers.map((paper, i) => (
                        <PaperCard
                          key={paper.id}
                          paper={paper}
                          index={i + 3}
                          variant="compact"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p
                    className="font-[family-name:var(--font-lora)] text-beige-dim/50"
                    style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.1vw, 0.875rem)" }}
                  >
                    No papers available yet.
                  </p>
                </div>
              )}
            </section>

            {/* Browse Archive CTA */}
            <section className="mt-8">
              <button
                onClick={() => setBrowseOpen(true)}
                className="group w-full text-left bg-surface rounded-2xl border border-divider/60 hover:border-gold/25 p-5 sm:p-6 transition-all duration-300 hover:shadow-[0_4px_30px_rgba(212,168,83,0.06)] card-hover"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 shrink-0 group-hover:bg-gold/15 transition-colors">
                    <Library className="size-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-[family-name:var(--font-playfair)] font-bold text-warm-white group-hover:text-gold transition-colors"
                      style={{ fontSize: "clamp(0.9375rem, 0.85rem + 0.2vw, 1.125rem)" }}
                    >
                      Explore the Full Archive
                    </h3>
                    <p
                      className="font-[family-name:var(--font-dm-sans)] text-beige-dim/50 mt-0.5"
                      style={{ fontSize: "clamp(0.625rem, 0.55rem + 0.15vw, 0.75rem)" }}
                    >
                      Browse papers from HuggingFace and arXiv, import any you want
                    </p>
                  </div>
                  <ArrowRight className="size-5 text-beige-dim/30 group-hover:text-gold group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                </div>
              </button>
            </section>
          </>
        )}

        {/* Engineering Tab */}
        {activeTab === "engineering" && <BlogSection />}

        {/* Business Tab */}
        {activeTab === "business" && <BusinessSection />}

        {/* Footer */}
        <footer className="py-8 mt-8">
          <div className="h-[2px] bg-gold/15" />
          <div className="h-[1px] bg-gold/8 mt-[2px]" />

          <div className="flex items-center justify-between mt-5 px-1">
            <p
              className="font-[family-name:var(--font-dm-sans)] font-bold tracking-[0.2em] uppercase text-beige-dim/35"
              style={{ fontSize: "clamp(0.5625rem, 0.5rem + 0.1vw, 0.625rem)" }}
            >
              BonsAI &middot; Est. 2025
            </p>
            <p
              className="font-[family-name:var(--font-dm-sans)] tracking-[0.15em] uppercase text-beige-dim/35"
              style={{ fontSize: "clamp(0.5625rem, 0.5rem + 0.1vw, 0.625rem)" }}
            >
              HuggingFace &middot; arXiv &middot; Gemini
            </p>
          </div>

          <p
            className="font-[family-name:var(--font-lora)] text-beige-dim/25 text-center mt-3 italic"
            style={{ fontSize: "clamp(0.6rem, 0.55rem + 0.1vw, 0.6875rem)" }}
          >
            Research distilled daily.
          </p>
        </footer>
      </div>

      {/* Floating Navigation */}
      <FloatingNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Browse Modal */}
      <BrowsePapersModal
        open={browseOpen}
        onClose={() => setBrowseOpen(false)}
        onImportComplete={() => fetchFeed(selectedTopic, selectedSubtopic)}
        currentTopicId={selectedTopic}
        currentSubtopicId={selectedSubtopic}
      />
    </main>
  );
}

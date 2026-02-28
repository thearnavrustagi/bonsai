import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FeedTagPill } from "@/components/category-tags";
import type { FeedPaper } from "@/lib/types";

const IMAGE_EXTS = /\.(png|jpe?g|gif|webp)(\?.*)?$/i;

function resolveImageUrl(paper: FeedPaper): string | undefined {
  const validMedia = paper.mediaUrls?.find((url) => IMAGE_EXTS.test(url));
  return validMedia || paper.thumbnail || undefined;
}

interface PaperCardProps {
  paper: FeedPaper;
  index: number;
  variant: "hero" | "secondary" | "compact";
}

export function PaperCard({ paper, index, variant }: PaperCardProps) {
  const imageUrl = resolveImageUrl(paper);

  if (variant === "hero") {
    return (
      <article>
        <Link
          href={`/paper/${paper.id}`}
          className="group block bg-surface rounded-2xl border border-divider/60 overflow-hidden card-hover"
        >
          {imageUrl ? (
            <div className="relative aspect-[16/9] sm:aspect-[2/1] overflow-hidden">
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex items-center gap-2 mb-2">
                  <FeedTagPill label={paper.mlTag} type="ml" />
                  <FeedTagPill label={paper.appTag} type="app" />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative aspect-[2.5/1] bg-gradient-to-br from-gold/5 via-surface to-simon-purple/5 flex items-center justify-center">
              <span className="masthead-title text-[8rem] text-gold/10 select-none">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="absolute bottom-4 left-5 flex items-center gap-2">
                <FeedTagPill label={paper.mlTag} type="ml" />
                <FeedTagPill label={paper.appTag} type="app" />
              </div>
            </div>
          )}

          <div className="p-5 sm:p-7">
            <h2
              className="font-[family-name:var(--font-lora)] font-bold text-warm-white leading-snug group-hover:text-gold transition-colors duration-300 mb-2"
              style={{ fontSize: "clamp(1.15rem, 1rem + 0.4vw, 1.5rem)" }}
            >
              {paper.title}
            </h2>

            <p
              className="font-[family-name:var(--font-dm-sans)] text-beige-dim/50 mb-3 line-clamp-1 tracking-wide"
              style={{ fontSize: "clamp(0.6875rem, 0.625rem + 0.1vw, 0.75rem)" }}
            >
              {paper.authors.join(", ")}
            </p>

            <div
              className="font-[family-name:var(--font-lora)] text-beige/60 leading-relaxed line-clamp-3 prose prose-invert prose-sm max-w-none prose-strong:text-warm-white/80 prose-p:m-0"
              style={{ fontSize: "clamp(0.8rem, 0.75rem + 0.1vw, 0.875rem)" }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {paper.description || paper.abstract}
              </ReactMarkdown>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "secondary") {
    return (
      <article className="flex-1 min-w-0">
        <Link
          href={`/paper/${paper.id}`}
          className="group block bg-surface rounded-xl border border-divider/50 overflow-hidden h-full card-hover"
        >
          {imageUrl ? (
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
            </div>
          ) : (
            <div className="aspect-[16/10] bg-gradient-to-br from-gold/5 via-surface to-simon-purple/5 flex items-center justify-center">
              <span className="masthead-title text-5xl text-gold/10 select-none">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
          )}

          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <FeedTagPill label={paper.mlTag} type="ml" />
              <FeedTagPill label={paper.appTag} type="app" />
            </div>

            <h2
              className="font-[family-name:var(--font-lora)] font-bold text-warm-white leading-snug group-hover:text-gold transition-colors duration-300 mb-1.5 line-clamp-2"
              style={{ fontSize: "clamp(0.9375rem, 0.85rem + 0.2vw, 1.0625rem)" }}
            >
              {paper.title}
            </h2>

            <p
              className="font-[family-name:var(--font-dm-sans)] text-beige-dim/50 mb-1.5 line-clamp-1 tracking-wide"
              style={{ fontSize: "clamp(0.6875rem, 0.625rem + 0.1vw, 0.75rem)" }}
            >
              {paper.authors.slice(0, 3).join(", ")}
            </p>

            <div
              className="font-[family-name:var(--font-lora)] text-beige/50 leading-relaxed line-clamp-2 prose prose-invert prose-sm max-w-none prose-strong:text-beige/70 prose-p:m-0"
              style={{ fontSize: "clamp(0.8rem, 0.75rem + 0.1vw, 0.875rem)" }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {paper.description || paper.abstract}
              </ReactMarkdown>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // compact variant
  return (
    <article>
      <Link
        href={`/paper/${paper.id}`}
        className="group flex items-start gap-4 rounded-xl py-3.5 px-3 -mx-1 transition-all duration-200 hover:bg-surface/80"
      >
        <span
          className="font-[family-name:var(--font-playfair)] font-black text-gold/15 leading-none select-none shrink-0 pt-0.5 w-8 text-right group-hover:text-gold/35 transition-colors duration-300"
          style={{ fontSize: "clamp(1.15rem, 1rem + 0.3vw, 1.375rem)" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <FeedTagPill label={paper.mlTag} type="ml" />
            <FeedTagPill label={paper.appTag} type="app" />
          </div>

          <h2
            className="font-[family-name:var(--font-lora)] font-bold text-warm-white leading-snug group-hover:text-gold transition-colors duration-300 mb-0.5"
            style={{ fontSize: "clamp(0.9375rem, 0.85rem + 0.2vw, 1.0625rem)" }}
          >
            {paper.title}
          </h2>

          <div
            className="font-[family-name:var(--font-lora)] text-beige/50 leading-relaxed line-clamp-1 prose prose-invert prose-sm max-w-none prose-strong:text-beige/70 prose-p:m-0"
            style={{ fontSize: "clamp(0.8rem, 0.75rem + 0.1vw, 0.875rem)" }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {paper.description || paper.abstract}
            </ReactMarkdown>
          </div>
        </div>

        <ArrowUpRight className="size-3.5 text-beige-dim/15 group-hover:text-gold/50 transition-all duration-300 shrink-0 mt-2" />
      </Link>

      <div className="h-[1px] bg-divider/40 ml-12 mr-2" />
    </article>
  );
}

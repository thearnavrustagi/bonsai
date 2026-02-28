"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogPost {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
  content: string;
}

interface BlogPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function BlogPostPage({ params }: BlogPageProps) {
  const { id } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/blog");
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = await res.json();
        const found = (data.posts as BlogPost[]).find((p) => p.id === id);
        if (found) {
          setPost(found);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Skeleton className="h-4 w-32 bg-surface rounded-lg mb-10" />
          <div className="space-y-3 mb-8">
            <Skeleton className="h-5 w-48 bg-surface rounded-lg" />
            <Skeleton className="h-12 w-full bg-surface rounded-lg" />
          </div>
          <div className="space-y-4">
            {[95, 88, 78, 92, 85, 70, 97, 82].map((w, i) => (
              <Skeleton
                key={i}
                className="h-4 bg-surface rounded-lg"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-warm-white mb-4">
            Post not found
          </h1>
          <p className="font-[family-name:var(--font-lora)] text-beige-dim text-sm mb-8">
            This post may no longer be available in the feed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm font-medium px-6 py-2.5 rounded-full border border-simon-purple/20 text-simon-purple-light hover:bg-simon-purple/10 transition-all duration-300"
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm text-beige-dim hover:text-simon-purple-light transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="size-4" />
          Back to BonsAI
        </Link>

        <article>
          <header className="mb-8">
            <time className="block font-[family-name:var(--font-lora)] text-xs text-beige-dim tracking-wider mb-3">
              {formatDate(post.pubDate)}
            </time>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-warm-white leading-tight mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-3">
              <span className="font-[family-name:var(--font-dm-sans)] text-xs text-simon-purple-light">
                Simon Willison
              </span>
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-[family-name:var(--font-dm-sans)] text-xs text-simon-purple/70 hover:text-simon-purple-light transition-colors"
              >
                Original
                <ExternalLink className="size-3" />
              </a>
            </div>
          </header>

          <div className="h-px bg-gradient-to-r from-transparent via-simon-purple/20 to-transparent mb-8" />

          <div
            className="prose prose-invert prose-sm sm:prose-base max-w-none
              prose-headings:font-[family-name:var(--font-playfair)] prose-headings:text-warm-white prose-headings:font-bold
              prose-p:font-[family-name:var(--font-lora)] prose-p:text-beige prose-p:leading-relaxed
              prose-a:text-simon-purple-light prose-a:no-underline hover:prose-a:underline
              prose-strong:text-warm-white
              prose-code:text-simon-purple-light/90 prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
              prose-pre:bg-surface prose-pre:border prose-pre:border-divider prose-pre:rounded-xl
              prose-blockquote:border-simon-purple/30 prose-blockquote:text-beige-dim
              prose-li:font-[family-name:var(--font-lora)] prose-li:text-beige
              prose-img:rounded-xl prose-img:border prose-img:border-divider"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        <footer className="py-8 mt-8">
          <div className="h-px bg-gradient-to-r from-transparent via-simon-purple/20 to-transparent mb-6" />
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-sm text-beige-dim hover:text-simon-purple-light transition-colors duration-200"
            >
              <ArrowLeft className="size-4" />
              Back to BonsAI
            </Link>
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-[family-name:var(--font-dm-sans)] text-sm text-simon-purple/70 hover:text-simon-purple-light transition-colors"
            >
              Read on simonwillison.net
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * Sanitize LLM-generated mermaid code to fix common syntax issues:
 * - Parentheses in subgraph titles (mermaid parses them as node shapes)
 * - Angle brackets / comparison operators inside node labels
 * - Subgraph names with spaces and special characters
 */
function sanitizeMermaidCode(raw: string): string {
  return raw
    .split("\n")
    .map((line) => {
      const indent = line.match(/^\s*/)?.[0] ?? "";
      const trimmed = line.trimStart();
      if (/^subgraph\s+/i.test(trimmed)) {
        const title = trimmed.slice(9).trim();
        if (/[\["']/.test(title)) return line;
        const safeId = title.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
        const displayTitle = title.replace(/[()]/g, "").trim();
        return `${indent}subgraph ${safeId} ["${displayTitle}"]`;
      }
      return line;
    })
    .join("\n")
    .replace(
      /(\[|{)([^[\]{}]+)(\]|})/g,
      (_match, open: string, label: string, close: string) => {
        const safe = label
          .replace(/<=/g, "≤")
          .replace(/>=/g, "≥")
          .replace(/</g, "‹")
          .replace(/>/g, "›");
        return `${open}${safe}${close}`;
      },
    );
}

let mermaidInitialized = false;

function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const id = useMemo(
    () => `mermaid-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  const sanitized = useMemo(() => sanitizeMermaidCode(code), [code]);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            suppressErrorRendering: true,
            theme: "dark",
            themeVariables: {
              primaryColor: "#2A2520",
              primaryTextColor: "#E8DCC8",
              primaryBorderColor: "#D4A853",
              lineColor: "#9A9080",
              secondaryColor: "#1C1A18",
              tertiaryColor: "#161616",
              fontFamily:
                "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "13px",
            },
            flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
            sequence: { useMaxWidth: true, mirrorActors: false },
          });
          mermaidInitialized = true;
        }
        const { svg: renderedSvg } = await mermaid.render(id, sanitized);
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        const errorDetail = err instanceof Error ? err : new Error(String(err));
        const codePreview = sanitized.length > 500 ? sanitized.slice(0, 500) + "…" : sanitized;
        console.error(
          `[MermaidDiagram] Failed to render diagram\n` +
          `  diagramId: ${id}\n` +
          `  error:     ${errorDetail.message}\n` +
          `  stack:     ${errorDetail.stack ?? "(no stack)"}\n` +
          `  sanitized code:\n${codePreview}`,
        );
        if (!cancelled) {
          setSvg("");
          setError(errorDetail.message);
        }
        const orphan = document.getElementById(`d${id}`);
        if (orphan) orphan.remove();
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [sanitized, id]);

  if (error) {
    console.warn(
      `[MermaidDiagram] Rendering fallback for diagram ${id} — ${error}`,
    );
    return null;
  }

  if (!svg) return null;

  return (
    <div className="mermaid-diagram-wrapper my-8 rounded-xl border border-divider/60 bg-surface/60 overflow-hidden">
      <div
        ref={containerRef}
        className="mermaid-diagram p-4 sm:p-6 overflow-x-auto overflow-y-hidden"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="mermaid-scroll-hint sm:hidden px-3 py-1.5 border-t border-divider/30 text-center">
        <span className="font-[family-name:var(--font-dm-sans)] text-[10px] text-beige-dim/40 tracking-wider uppercase">
          Swipe to explore
        </span>
      </div>
    </div>
  );
}

interface MarkdownContentProps {
  content: string;
  className?: string;
  dropcap?: boolean;
}

export function MarkdownContent({
  content,
  className = "",
  dropcap = false,
}: MarkdownContentProps) {
  const components: Components = useMemo(
    () => ({
      h1: ({ children }) => (
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-warm-white mt-10 mb-4 flex items-center gap-3">
          <span className="w-1 h-8 rounded-full bg-gradient-to-b from-gold to-gold/20 shrink-0" />
          {children}
        </h2>
      ),
      h2: ({ children }) => (
        <h3 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-warm-white mt-8 mb-3 flex items-center gap-3">
          <span className="w-1 h-6 rounded-full bg-gradient-to-b from-gold/80 to-gold/10 shrink-0" />
          {children}
        </h3>
      ),
      h3: ({ children }) => (
        <h4 className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl font-semibold text-warm-white/90 mt-6 mb-2">
          {children}
        </h4>
      ),
      p: ({ children, node }) => {
        const hasBlockChild = node?.children?.some(
          (child) =>
            child.type === "element" &&
            ["div", "figure", "pre"].includes(child.tagName)
        );
        if (hasBlockChild) return <>{children}</>;

        return (
          <p className="font-[family-name:var(--font-lora)] text-beige/85 text-base sm:text-lg leading-relaxed mb-5">
            {children}
          </p>
        );
      },
      strong: ({ children }) => (
        <strong className="font-semibold text-warm-white/95">{children}</strong>
      ),
      em: ({ children }) => (
        <em className="italic text-beige/90">{children}</em>
      ),
      blockquote: ({ children }) => (
        <blockquote className="my-6 rounded-r-lg border-l-[3px] border-gold/50 bg-surface/60 py-4 px-5">
          <div className="font-[family-name:var(--font-lora)] text-beige/80 italic text-base leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
            {children}
          </div>
        </blockquote>
      ),
      ul: ({ children }) => (
        <ul className="my-4 ml-1 space-y-2 list-none">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="my-4 ml-1 space-y-2 list-none counter-reset-item">
          {children}
        </ol>
      ),
      li: ({ children, node }) => {
        const parent = node?.position ? "ul" : "ul";
        const isOrdered =
          node &&
          "tagName" in node &&
          (node as unknown as { tagName: string }).tagName === "li";
        void parent;
        void isOrdered;
        return (
          <li className="flex gap-3 font-[family-name:var(--font-lora)] text-beige/85 text-base leading-relaxed">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold/50 shrink-0" />
            <span className="flex-1">{children}</span>
          </li>
        );
      },
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold hover:text-gold/80 underline underline-offset-2 decoration-gold/30 hover:decoration-gold/60 transition-colors"
        >
          {children}
        </a>
      ),
      code: ({ className: codeClassName, children, ...props }) => {
        const match = /language-(\w+)/.exec(codeClassName || "");
        const lang = match ? match[1] : null;
        const codeStr = String(children).replace(/\n$/, "");
        const isInline =
          !codeClassName &&
          !String(children).includes("\n");

        if (lang === "mermaid") {
          return <MermaidDiagram code={codeStr} />;
        }

        if (isInline) {
          return (
            <code className="rounded bg-surface px-1.5 py-0.5 text-sm font-mono text-gold/90 border border-divider/40">
              {children}
            </code>
          );
        }

        return (
          <div className="my-6 rounded-xl border border-divider/60 bg-surface overflow-hidden">
            {lang && (
              <div className="px-4 py-1.5 border-b border-divider/40 bg-surface-hover">
                <span className="font-[family-name:var(--font-dm-sans)] text-[10px] font-semibold uppercase tracking-wider text-beige-dim/60">
                  {lang}
                </span>
              </div>
            )}
            <pre className="p-4 overflow-x-auto">
              <code
                className={`text-sm font-mono text-beige/80 ${codeClassName ?? ""}`}
                {...props}
              >
                {children}
              </code>
            </pre>
          </div>
        );
      },
      pre: ({ children }) => <>{children}</>,
      table: ({ children }) => (
        <div className="my-6 overflow-x-auto rounded-xl border border-divider/60">
          <table className="w-full text-sm">{children}</table>
        </div>
      ),
      thead: ({ children }) => (
        <thead className="bg-surface border-b border-divider/60">
          {children}
        </thead>
      ),
      th: ({ children }) => (
        <th className="px-4 py-2.5 text-left font-[family-name:var(--font-dm-sans)] font-semibold text-warm-white/90 text-xs uppercase tracking-wider">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="px-4 py-2.5 font-[family-name:var(--font-lora)] text-beige/80 border-t border-divider/30">
          {children}
        </td>
      ),
      hr: () => (
        <div className="my-10 flex items-center justify-center gap-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold/30" />
          <div className="h-1.5 w-1.5 rounded-full bg-gold/40" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold/30" />
        </div>
      ),
    }),
    []
  );

  return (
    <div
      className={`markdown-content ${dropcap ? "has-dropcap" : ""} ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface MermaidBlockProps {
  title: string;
  code: string;
}

export function MermaidBlock({ title, code }: MermaidBlockProps) {
  return (
    <div className="my-6">
      {title && (
        <p className="font-[family-name:var(--font-dm-sans)] text-xs font-semibold text-beige-dim uppercase tracking-wider mb-3 text-center">
          {title}
        </p>
      )}
      <MermaidDiagram code={code} />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ZoomIn, ZoomOut, AlertCircle, ExternalLink } from "lucide-react";

// ── Shared PDF document cache ──
// Prevents every figure component from independently downloading the same
// multi-MB PDF. The cache is keyed by proxy URL and deduplicates in-flight
// requests so even concurrent mounts share a single fetch.
type PDFDocumentProxy = Awaited<
  ReturnType<Awaited<typeof import("pdfjs-dist")>["getDocument"]>["promise"]
>;

const pdfCache = new Map<string, Promise<PDFDocumentProxy>>();
let workerConfigured = false;

async function getPdfDocument(pdfUrl: string): Promise<PDFDocumentProxy> {
  const pdfjsLib = await import("pdfjs-dist");

  if (!workerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    workerConfigured = true;
  }

  const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`;

  const existing = pdfCache.get(proxyUrl);
  if (existing) return existing;

  const loading = pdfjsLib.getDocument({
    url: proxyUrl,
    disableAutoFetch: true,
    disableStream: false,
  }).promise;

  loading.catch(() => {
    pdfCache.delete(proxyUrl);
  });

  pdfCache.set(proxyUrl, loading);
  return loading;
}

interface PdfPageViewerProps {
  pdfUrl: string;
  pageNumber: number;
  figureLabel: string;
  description: string;
  arxivUrl?: string;
}

export function PdfPageViewer({
  pdfUrl,
  pageNumber,
  figureLabel,
  description,
}: PdfPageViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel(): void } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1.5);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Cancel any in-flight render on this canvas
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      setLoading(true);
      setError(false);

      try {
        const pdf = await getPdfDocument(pdfUrl);
        if (cancelled) return;

        const pg = Math.min(pageNumber, pdf.numPages);
        const page = await pdf.getPage(pg);
        if (cancelled) return;

        const viewport = page.getViewport({ scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable");

        const task = page.render({ canvas, viewport });
        renderTaskRef.current = task;

        await task.promise;
        renderTaskRef.current = null;
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (cancelled) return;
        const errorDetail = err instanceof Error ? err : new Error(String(err));
        // pdf.js fires "RenderingCancelledException" when we cancel — not a real error
        if (errorDetail.message?.includes("Rendering cancelled")) return;
        console.error(
          `[PdfPageViewer] Failed to render PDF figure\n` +
          `  pdfUrl:     ${pdfUrl}\n` +
          `  proxyUrl:   /api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}\n` +
          `  pageNumber: ${pageNumber}\n` +
          `  scale:      ${scale}\n` +
          `  error:      ${errorDetail.message}\n` +
          `  stack:      ${errorDetail.stack ?? "(no stack)"}`,
        );
        setError(true);
        setLoading(false);
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfUrl, pageNumber, scale]);

  return (
    <div className="group rounded-xl bg-surface/60 border border-divider/40 overflow-hidden hover:border-gold/20 transition-all duration-300">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-divider/30">
        <div className="flex items-center gap-2">
          <a
            href={`${pdfUrl}#page=${pageNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 group/link"
          >
            <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-gold/10 border border-gold/20 font-[family-name:var(--font-dm-sans)] text-[10px] font-semibold text-gold uppercase tracking-wider group-hover/link:bg-gold/20 transition-colors">
              {figureLabel}
            </span>
            <span className="font-[family-name:var(--font-dm-sans)] text-[10px] text-beige-dim/50 group-hover/link:text-gold/70 transition-colors">
              p.{pageNumber}
            </span>
            <ExternalLink className="size-2.5 text-beige-dim/30 group-hover/link:text-gold/60 transition-colors" />
          </a>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.75, s - 0.25))}
            className="p-1.5 rounded-md text-beige-dim/50 hover:text-beige hover:bg-surface-hover transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            className="p-1.5 rounded-md text-beige-dim/50 hover:text-beige hover:bg-surface-hover transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div
        className={`relative bg-white/[0.03] overflow-auto transition-all duration-300 ${
          expanded ? "max-h-[80vh]" : "max-h-[400px] sm:max-h-[500px]"
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80 z-10">
            <Loader2 className="size-6 text-gold/60 animate-spin" />
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center gap-2 py-12 px-4">
            <AlertCircle className="size-4 text-beige-dim/40" />
            <span className="font-[family-name:var(--font-dm-sans)] text-xs text-beige-dim/50">
              Could not load figure
            </span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`mx-auto block ${error ? "hidden" : ""}`}
          style={{ maxWidth: "100%" }}
        />
        {!expanded && !error && !loading && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#161616] to-transparent pointer-events-none" />
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="px-4 py-3 border-t border-divider/30">
          <p className="font-[family-name:var(--font-lora)] text-beige/65 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      )}
    </div>
  );
}

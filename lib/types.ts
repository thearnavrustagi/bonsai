export interface MermaidDiagram {
  title: string;
  code: string;
}

export interface PaperSummary {
  id: string;
  title: string;
  authors: string[];
  arxivUrl: string;
  pdfUrl: string;
  summary: string;
  technicalDetails: string;
  keyFindings: string[];
  diagrams: DiagramDescription[];
  mermaidDiagrams?: MermaidDiagram[];
  tldr: string;
  upvotes: number;
  publishedAt: string;
  fetchedAt: string;
  mediaUrls: string[];
  thumbnail?: string;
}

export interface DiagramDescription {
  figureNumber: string;
  description: string;
  pageNumber: number;
}

export interface DayMeta {
  date: string;
  paperIds: string[];
  fetchedAt: string;
}

export interface FeedPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  description: string;
  mlTag: string;
  appTag: string;
  arxivUrl: string;
  pdfUrl: string;
  publishedAt: string;
  mediaUrls: string[];
  thumbnail?: string;
  source: "huggingface" | "arxiv";
}

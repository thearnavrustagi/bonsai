import axios from "axios";

const ARXIV_API = "http://export.arxiv.org/api/query";

export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  publishedAt: string;
  pdfUrl: string;
  arxivUrl: string;
}

function getDateRange(range: "day" | "week" | "month"): { from: string; to: string } {
  const now = new Date();
  const to = formatArxivDate(now);
  const from = new Date(now);
  if (range === "day") {
    from.setDate(from.getDate() - 1);
  } else if (range === "week") {
    from.setDate(from.getDate() - 7);
  } else {
    from.setDate(from.getDate() - 30);
  }
  return { from: formatArxivDate(from), to };
}

function formatArxivDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function buildSearchQuery(categories: string[], dateRange?: "day" | "week" | "month"): string {
  const catQuery = categories.map((c) => `cat:${c}`).join("+OR+");
  if (!dateRange) return catQuery;
  const { from, to } = getDateRange(dateRange);
  return `${catQuery}+AND+submittedDate:[${from}0000+TO+${to}2359]`;
}

function extractPaperId(idUrl: string): string {
  const match = idUrl.match(/(\d{4}\.\d{4,5})/);
  return match ? match[1] : idUrl;
}

function cleanTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim();
}

interface AtomEntry {
  id?: string;
  title?: string;
  summary?: string;
  author?: string | { name?: string }[];
  published?: string;
  updated?: string;
  link?: string | { $?: { href?: string } }[];
  "arxiv:primary_category"?: { $?: { term?: string } };
  category?: string | { $?: { term?: string } }[] | { $?: { term?: string } };
}

function parseAtomXml(xml: string): AtomEntry[] {
  const entries: AtomEntry[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];

    const getTag = (tag: string): string => {
      const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
      const m = block.match(r);
      return m ? m[1].trim() : "";
    };

    const id = getTag("id");
    const title = getTag("title");
    const summary = getTag("summary");
    const published = getTag("published");

    const authorRegex = /<author>\s*<name>([^<]+)<\/name>\s*<\/author>/g;
    const authors: string[] = [];
    let authorMatch;
    while ((authorMatch = authorRegex.exec(block)) !== null) {
      authors.push(authorMatch[1].trim());
    }

    const catRegex = /<category[^>]*term="([^"]+)"/g;
    const categories: string[] = [];
    let catMatch;
    while ((catMatch = catRegex.exec(block)) !== null) {
      categories.push(catMatch[1]);
    }

    entries.push({
      id,
      title,
      summary,
      author: authors.length > 0 ? authors.map((name) => ({ name })) : undefined,
      published,
      category: categories.length > 0 ? categories.map((term) => ({ $: { term } })) : undefined,
    });
  }

  return entries;
}

function entriesToPapers(entries: AtomEntry[]): ArxivPaper[] {
  return entries.map((entry) => {
    const paperId = extractPaperId(entry.id || "");

    const authors: string[] = [];
    if (Array.isArray(entry.author)) {
      for (const a of entry.author) {
        if (typeof a === "string") authors.push(a);
        else if (a && typeof a === "object" && a.name) authors.push(a.name);
      }
    } else if (typeof entry.author === "string") {
      authors.push(entry.author);
    }

    const cats: string[] = [];
    if (Array.isArray(entry.category)) {
      for (const c of entry.category) {
        if (typeof c === "string") cats.push(c);
        else if (c && typeof c === "object" && c.$?.term) cats.push(c.$.term);
      }
    } else if (entry.category && typeof entry.category === "object" && !Array.isArray(entry.category)) {
      const c = entry.category as { $?: { term?: string } };
      if (c.$?.term) cats.push(c.$.term);
    }

    return {
      id: paperId,
      title: cleanTitle(entry.title || ""),
      authors,
      abstract: (entry.summary || "").trim(),
      categories: cats,
      publishedAt: entry.published || "",
      pdfUrl: `https://arxiv.org/pdf/${paperId}`,
      arxivUrl: `https://arxiv.org/abs/${paperId}`,
    };
  });
}

async function fetchWithRetry(url: string, retries = 1): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.get<string>(url, {
        timeout: 20000,
        responseType: "text",
      });
      return data;
    } catch (err) {
      console.error(`ArXiv API attempt ${attempt + 1} failed for: ${url}`, err instanceof Error ? err.message : err);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Unreachable");
}

export async function fetchArxivPapers(
  categories: string[],
  maxResults: number,
  dateRange?: "day" | "week" | "month"
): Promise<ArxivPaper[]> {
  const searchQuery = buildSearchQuery(categories, dateRange);
  const url = `${ARXIV_API}?search_query=${searchQuery}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

  console.log(`[arxiv] Fetching: ${url}`);

  const xmlData = await fetchWithRetry(url);

  if (!xmlData || !xmlData.includes("<entry>")) {
    console.warn(`[arxiv] No entries in response for categories: ${categories.join(", ")}`);
    return [];
  }

  const entries = parseAtomXml(xmlData);
  const papers = entriesToPapers(entries);

  console.log(`[arxiv] Got ${papers.length} papers for ${categories.join(", ")}`);
  return papers;
}

export async function fetchArxivTitles(
  categories: string[],
  maxResults: number,
  dateRange: "day" | "week" | "month"
): Promise<string[]> {
  const papers = await fetchArxivPapers(categories, maxResults, dateRange);
  return papers.map((p) => p.title);
}

export async function fetchArxivItems(
  categories: string[],
  maxResults: number,
  dateRange: "day" | "week" | "month"
): Promise<{ title: string; abstract: string }[]> {
  const papers = await fetchArxivPapers(categories, maxResults, dateRange);
  return papers.map((p) => ({
    title: p.title,
    abstract: p.abstract.slice(0, 200).trim(),
  }));
}

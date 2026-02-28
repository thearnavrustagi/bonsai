import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import type {
  PaperSummary,
  DiagramDescription,
  MermaidDiagram,
} from "./types";
import type { FetchedPaper } from "./huggingface";

export interface PaperTags {
  mlTag: string;
  appTag: string;
  description: string;
}

const SYSTEM_PROMPT = `You are an expert science communicator. Given a research paper PDF, produce a structured JSON summary.

IMPORTANT: All text fields support **Markdown** and **LaTeX math**. Use them liberally to make the content rich and engaging.

Your response must be valid JSON with exactly these fields:
{
  "summary": "A 3-4 paragraph markdown-formatted explanation. Use **bold** for key terms on first mention, *italic* for emphasis. Include ### subheadings to break up sections where natural. Write accessibly but don't shy away from naming techniques — just explain them inline.",
  "technicalDetails": "A detailed markdown-formatted technical breakdown. MUST include:\n- ### Subheadings for each major aspect (e.g. ### Architecture, ### Training, ### Loss Function)\n- LaTeX equations for ALL key formulas: use $...$ for inline math and $$...$$ on its own line for display equations\n- **Bold** key terms, bullet lists for enumerations\n- Reference specific numbers, hyperparameters, dataset sizes",
  "keyFindings": ["Each finding as a markdown string. Use **bold** for the key insight and inline $math$ where relevant. Keep each to 1-2 sentences."],
  "diagrams": [{"figureNumber": "Figure 1", "description": "Detailed description of what this figure shows and its significance", "pageNumber": 1}],
  "mermaidDiagrams": [{"title": "Descriptive Title", "code": "Valid mermaid.js diagram code (graph TD, flowchart LR, or sequenceDiagram). Represent the paper's architecture, pipeline, or key process flow. Use short readable labels. MUST be syntactically valid mermaid."}],
  "tldr": "A single punchy sentence with **bold** key terms."
}

Rules:
- For LaTeX in JSON strings, escape backslashes: use \\\\alpha not \\alpha, \\\\frac{a}{b} not \\frac{a}{b}
- Produce 1-2 mermaid diagrams showing the system architecture or key algorithm flow
- For mermaid diagrams: use simple node IDs (A, B, C or camelCase), keep labels SHORT (2-4 words max). PREFER "flowchart TD" or "flowchart LR" (NOT sequenceDiagram — those render poorly on mobile). Keep diagrams compact: 5-10 nodes max. NO long text in node labels. CRITICAL syntax rules: never use parentheses () in subgraph titles (use brackets [] instead), never use < > or <= >= inside node labels (use words like "less than", "greater than" or unicode ≤ ≥ ‹ ›), never use special characters like & in labels unless as the mermaid multi-target operator, and always use simple ASCII for node IDs.
- For diagrams (figure descriptions): list EVERY figure and table in the paper. The pageNumber field is CRITICAL — it must be the exact PDF page number (1-indexed) where the figure appears. We use this to render the actual PDF page, so accuracy matters.
- Be accurate, engaging, and thorough
- For the summary, prioritize clarity — explain like a science journalist writing for a smart audience
- For technicalDetails, be precise: include the actual equations, not just descriptions of them`;

export async function summarizePaper(
  pdfPath: string,
  paperInfo: FetchedPaper
): Promise<PaperSummary> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
    },
  }, {
    timeout: 300_000,
  });

  const pdfBuffer = await fs.readFile(pdfPath);
  const pdfBase64 = pdfBuffer.toString("base64");

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    {
      inlineData: {
        mimeType: "application/pdf",
        data: pdfBase64,
      },
    },
    {
      text: `Please analyze this paper: "${paperInfo.title}" and produce the JSON summary as specified.`,
    },
  ]);

  const responseText = result.response.text();

  let parsed: {
    summary: string;
    technicalDetails: string;
    keyFindings: string[];
    diagrams: DiagramDescription[];
    mermaidDiagrams?: MermaidDiagram[];
    tldr: string;
  };

  try {
    parsed = JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Gemini response");
    }
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      const sanitized = jsonMatch[0]
        .replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, "\\\\")
        .replace(/[\x00-\x1f]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
      parsed = JSON.parse(sanitized);
    }
  }

  return {
    id: paperInfo.id,
    title: paperInfo.title,
    authors: paperInfo.authors,
    arxivUrl: paperInfo.arxivUrl,
    pdfUrl: paperInfo.pdfUrl,
    summary: parsed.summary,
    technicalDetails: parsed.technicalDetails,
    keyFindings: parsed.keyFindings,
    diagrams: parsed.diagrams || [],
    mermaidDiagrams: parsed.mermaidDiagrams || [],
    tldr: parsed.tldr,
    upvotes: paperInfo.upvotes,
    publishedAt: paperInfo.publishedAt,
    fetchedAt: new Date().toISOString(),
    mediaUrls: paperInfo.mediaUrls,
    thumbnail: paperInfo.thumbnail,
  };
}

export async function generateTrends(
  titles: string[],
  topicLabel: string,
  subtopicLabel: string,
  range: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
  }, {
    timeout: 120_000,
  });

  const numberedTitles = titles.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const prompt = `You are a research trend analyst. Given ${titles.length} recent paper titles from ${topicLabel}/${subtopicLabel} (${range}), write a sharp analysis in **100 words or fewer**. No filler, no preamble.

Structure (use these exact headers with ##):

## Gaps & Issues
2-3 bullet points. What critical problems remain unsolved? Where are current approaches failing? Be specific — name methods/domains, not vague categories.

## Research Opportunities
2-3 bullet points. Where should new research focus? What emerging directions show promise? Suggest concrete angles combining insights from these papers.

**Bold** key terms. Be direct and technical. Every word must earn its place.

Titles:
${numberedTitles}`;

  const result = await model.generateContent([{ text: prompt }]);
  return result.response.text();
}

export async function generateDevPulse(
  titles: string[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  }, {
    timeout: 120_000,
  });

  const numberedTitles = titles.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const prompt = `You are an AI engineering analyst writing for developers. Given ${titles.length} recent blog post and newsletter titles from the AI engineering space, write a sharp analysis in **100 words or fewer**. No filler, no preamble.

Structure (use these exact headers with ##):

## What's Shipping
2-3 bullet points. What tools, frameworks, releases, or patterns are gaining real traction right now? Name specific projects/products.

## What to Watch
2-3 bullet points. What emerging techniques or shifts in developer workflows should engineers pay attention to? What's about to matter?

**Bold** key terms. Be direct and practical. Write for builders, not spectators.

Titles:
${numberedTitles}`;

  const result = await model.generateContent([{ text: prompt }]);
  return result.response.text();
}

const BATCH_TAGS_PROMPT = `For each paper below, produce a JSON object with exactly these fields:
- "mlTag": one of ["LLMs", "Vision", "RL", "Generative", "Optimization", "Graph", "Theory", "Systems", "Data", "Other"]
- "appTag": one of ["Healthcare", "Robotics", "Code", "Science", "Education", "Finance", "NLP", "Security", "Retrieval", "General"]
- "description": a 2-3 sentence markdown description with **bold** key terms. Be concise and informative.

Return a JSON array of objects in the same order as the papers.`;

export async function batchGenerateTags(
  papers: { title: string; abstract: string }[]
): Promise<PaperTags[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  }, {
    timeout: 120_000,
  });

  const papersText = papers
    .map(
      (p, i) =>
        `${i + 1}. Title: "${p.title}" | Abstract: "${p.abstract.slice(0, 300)}"`
    )
    .join("\n");

  const result = await model.generateContent([
    { text: BATCH_TAGS_PROMPT },
    { text: `Papers:\n${papersText}` },
  ]);

  const responseText = result.response.text();
  let parsed: PaperTags[];

  try {
    parsed = JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON array from Gemini response");
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  return parsed;
}

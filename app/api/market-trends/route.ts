import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Parser from "rss-parser";
import { getCached, setCache } from "@/lib/storage";

const parser = new Parser({
  customFields: { item: [["dc:creator", "creator"]] },
});

const TC_FEED = "https://techcrunch.com/category/artificial-intelligence/feed/";
const RUNDOWN_FEED = "https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml";

async function fetchHeadlines(): Promise<string[]> {
  const titles: string[] = [];

  const [tcResult, rdResult] = await Promise.allSettled([
    parser.parseURL(TC_FEED),
    parser.parseURL(RUNDOWN_FEED),
  ]);

  if (tcResult.status === "fulfilled") {
    for (const item of (tcResult.value.items ?? []).slice(0, 15)) {
      if (item.title) titles.push(item.title);
    }
  }

  if (rdResult.status === "fulfilled") {
    for (const item of (rdResult.value.items ?? []).slice(0, 8)) {
      if (item.title) titles.push(item.title);
    }
  }

  return titles;
}

async function generateMarketTrends(titles: string[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { maxOutputTokens: 4096 },
  });

  const numberedTitles = titles.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const prompt = `You are a senior AI industry analyst writing a daily market brief. Given ${titles.length} recent AI industry headlines from TechCrunch and The Rundown AI, write a sharp market trends analysis in **120 words or fewer**. No filler, no preamble.

Structure (use these exact headers with ##):

## Where Investment Is Flowing
2-3 bullet points. What sectors, companies, or technologies are attracting capital right now? Name specific deals, rounds, or companies where possible.

## Big Company Moves
2-3 bullet points. What are the major AI companies (OpenAI, Google, Meta, Anthropic, Microsoft, etc.) focused on? What strategic shifts are happening?

## Industry Direction
2-3 bullet points. What broader trends define where the industry is heading? What goals and bets are shaping the next 6-12 months?

**Bold** key terms. Be direct, specific, and insightful. Write for investors and strategists, not tourists.

Headlines:
${numberedTitles}`;

  const result = await model.generateContent([{ text: prompt }]);
  return result.response.text();
}

export async function GET() {
  const cacheKey = "market-trends";

  try {
    const cached = await getCached<string>(cacheKey);
    if (cached) {
      return NextResponse.json({ content: cached });
    }

    const titles = await fetchHeadlines();
    if (titles.length === 0) {
      return NextResponse.json({ content: "" });
    }

    const content = await generateMarketTrends(titles);
    await setCache(cacheKey, content);

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Market trends API error:", err);
    return NextResponse.json(
      { error: "Failed to generate market trends", content: "" },
      { status: 500 }
    );
  }
}

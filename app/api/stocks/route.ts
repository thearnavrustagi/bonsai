import { NextResponse } from "next/server";

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketState: string;
}

const AI_STOCKS: Record<string, string> = {
  NVDA: "NVIDIA",
  GOOGL: "Alphabet",
  MSFT: "Microsoft",
  META: "Meta",
  AMZN: "Amazon",
  AMD: "AMD",
  TSM: "TSMC",
  ORCL: "Oracle",
  PLTR: "Palantir",
  CRM: "Salesforce",
};

async function fetchQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    return {
      symbol,
      name: AI_STOCKS[symbol] || symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      marketState: meta.marketState || "CLOSED",
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const symbols = Object.keys(AI_STOCKS);
    const results = await Promise.allSettled(symbols.map(fetchQuote));

    const quotes: StockQuote[] = results
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter((q): q is StockQuote => q !== null);

    return NextResponse.json(
      { quotes },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error("Failed to fetch stock quotes:", err);
    return NextResponse.json({ quotes: [] }, { status: 500 });
  }
}

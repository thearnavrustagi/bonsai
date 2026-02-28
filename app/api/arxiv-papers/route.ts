import { NextRequest, NextResponse } from "next/server";
import { fetchArxivPapers } from "@/lib/arxiv";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoriesParam = searchParams.get("categories") || "";
  const maxResults = parseInt(searchParams.get("maxResults") || "30", 10);

  if (!categoriesParam) {
    return NextResponse.json({ papers: [] });
  }

  const categories = categoriesParam.split(",").map((c) => c.trim());

  try {
    const papers = await fetchArxivPapers(categories, maxResults);
    return NextResponse.json({ papers });
  } catch (err) {
    console.error("arXiv papers API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch arXiv papers" },
      { status: 500 }
    );
  }
}

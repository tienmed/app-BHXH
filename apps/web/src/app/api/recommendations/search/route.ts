import { NextRequest, NextResponse } from "next/server";
import { clinicalEngine } from "@/lib/clinical-engine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const type = (searchParams.get("type") || "CLS") as "CLS" | "MEDICATION";
    const apiBaseUrl = process.env.NEST_API_URL;

    // Mode 1: Proxy to NestJS
    if (apiBaseUrl) {
      const apiUrl = `${apiBaseUrl}/recommendations/search?q=${encodeURIComponent(q)}&type=${type}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    }

    // Mode 2: Standalone CSV
    const data = await clinicalEngine.searchCatalog(q, type);
    return NextResponse.json(data);

  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      {
        error: "search_failed",
        message: error instanceof Error ? error.message : "Internal Error",
      },
      { status: 500 }
    );
  }
}

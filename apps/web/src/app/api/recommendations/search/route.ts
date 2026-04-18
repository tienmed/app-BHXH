import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy: Forwarding search requests to centralized NestJS API (localhost:3001)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "CLS";

    const apiUrl = `http://localhost:3001/recommendations/search?q=${encodeURIComponent(q)}&type=${type}`;
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "api_proxy_failed", message: errorData.message || `API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "proxy_connection_failed",
        message: error instanceof Error ? error.message : "Internal Proxy Error",
      },
      { status: 502 }
    );
  }
}

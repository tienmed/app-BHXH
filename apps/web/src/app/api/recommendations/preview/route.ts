import { NextRequest, NextResponse } from "next/server";
import { clinicalEngine } from "@/lib/clinical-engine";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const apiBaseUrl = process.env.NEST_API_URL;

    // Mode 1: Proxy to NestJS (if configured)
    if (apiBaseUrl) {
      const response = await fetch(`${apiBaseUrl}/recommendations/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    }

    // Mode 2: Standalone CSV (Default or Fallback)
    const data = await clinicalEngine.getPreview(payload);
    return NextResponse.json(data);

  } catch (error) {
    console.error("Preview API Error:", error);
    return NextResponse.json(
      {
        error: "recommendation_failed",
        message: error instanceof Error ? error.message : "Internal Error",
      },
      { status: 500 }
    );
  }
}

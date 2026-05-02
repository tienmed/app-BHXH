import { NextResponse } from "next/server";

const summaryApiUrl =
  process.env.INTERNAL_INTERACTION_API_URL?.replace(/\/feedback$/, "/feedback/summary") ||
  process.env.NEXT_PUBLIC_INTERACTION_API_URL?.replace(/\/feedback$/, "/feedback/summary") ||
  "http://localhost:3001/interactions/feedback/summary";

export async function GET() {
  try {
    const response = await fetch(summaryApiUrl, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ totalFeedback: 0, types: [], recommendedActions: [] }, { status: 200 });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ totalFeedback: 0, types: [], recommendedActions: [] }, { status: 200 });
  }
}

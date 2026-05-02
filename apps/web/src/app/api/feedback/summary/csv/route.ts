import { NextResponse } from "next/server";

const summaryCsvApiUrl =
  process.env.INTERNAL_INTERACTION_API_URL?.replace(/\/feedback$/, "/feedback/summary/csv") ||
  process.env.NEXT_PUBLIC_INTERACTION_API_URL?.replace(/\/feedback$/, "/feedback/summary/csv") ||
  "http://localhost:3001/interactions/feedback/summary/csv";

export async function GET() {
  try {
    const response = await fetch(summaryCsvApiUrl, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: "summary_csv_unavailable" }, { status: 502 });
    }
    const csv = await response.text();
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="feedback-summary.csv"'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}

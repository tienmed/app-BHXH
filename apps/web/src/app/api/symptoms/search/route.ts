import { NextRequest, NextResponse } from "next/server";
import { loadSymptomCatalog } from "../../../utils/csv-loader";

/**
 * CSV-Based Symptom Search API (Pilot Phase)
 * Loads symptom catalog directly from local CSV seed file.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";

  try {
    const catalog = loadSymptomCatalog();

    if (!q) {
      return NextResponse.json({ source: "local-csv", symptoms: catalog });
    }

    const filtered = catalog.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.synonyms.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.bodySystem.toLowerCase().includes(q)
    );

    return NextResponse.json({
      source: "local-csv",
      symptoms: filtered.slice(0, 15),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "csv_load_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { loadIcdCatalog } from "../../../utils/csv-loader";

/**
 * CSV-Based Diagnosis Options API (Pilot Phase)
 * Loads ICD catalog directly from local CSV seed file.
 */
export async function GET() {
  try {
    const catalog = loadIcdCatalog();

    const options = catalog
      .map((entry) => ({
        code: entry.code,
        label: entry.name,
        chapter: entry.chapter,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));

    return NextResponse.json({
      source: "local-csv",
      options,
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

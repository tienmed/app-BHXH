import { NextRequest, NextResponse } from "next/server";
import { loadSymptomIcdMappings, loadIcdCatalog } from "../../../utils/csv-loader";

/**
 * CSV-Based ICD Narrowing API (Pilot Phase)
 * Weighted Intersection Algorithm using local CSV data.
 *
 * Scoring: finalScore = matchRatio × totalScore
 *   - matchRatio = matched symptoms / input symptoms
 *   - totalScore = sum of relevance_score across matched symptoms
 *
 * EBM sources: Harrison's, ESC, GINA, ACG, EULAR, ADA, AAO guidelines
 */

interface NarrowedIcdResult {
  icdCode: string;
  icdName: string;
  totalScore: number;
  matchRatio: number;
  finalScore: number;
  matchedSymptoms: string[];
}

function narrowIcd(symptomCodes: string[]): NarrowedIcdResult[] {
  if (symptomCodes.length === 0) return [];

  const mappings = loadSymptomIcdMappings();
  const icdCatalog = loadIcdCatalog();
  const icdNameMap = new Map(icdCatalog.map((e) => [e.code, e.name]));

  // Group by ICD, accumulate scores
  const icdScores = new Map<string, { totalScore: number; matchedSymptoms: Set<string> }>();

  for (const mapping of mappings) {
    if (!symptomCodes.includes(mapping.symptomCode)) continue;

    const existing = icdScores.get(mapping.icdCode);
    if (existing) {
      existing.totalScore += mapping.relevanceScore;
      existing.matchedSymptoms.add(mapping.symptomCode);
    } else {
      icdScores.set(mapping.icdCode, {
        totalScore: mapping.relevanceScore,
        matchedSymptoms: new Set([mapping.symptomCode]),
      });
    }
  }

  // Compute finalScore = matchRatio × totalScore
  const totalSymptoms = symptomCodes.length;
  const results: NarrowedIcdResult[] = [];

  for (const [icdCode, data] of icdScores) {
    const matchRatio = data.matchedSymptoms.size / totalSymptoms;
    results.push({
      icdCode,
      icdName: icdNameMap.get(icdCode) ?? icdCode,
      totalScore: data.totalScore,
      matchRatio: Math.round(matchRatio * 100) / 100,
      finalScore: Math.round(matchRatio * data.totalScore),
      matchedSymptoms: Array.from(data.matchedSymptoms),
    });
  }

  // Sort: matchRatio DESC, then finalScore DESC
  results.sort((a, b) => {
    if (b.matchRatio !== a.matchRatio) return b.matchRatio - a.matchRatio;
    return b.finalScore - a.finalScore;
  });

  return results.slice(0, 20);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const symptomCodes: string[] = Array.isArray(body?.symptomCodes) ? body.symptomCodes : [];

    if (symptomCodes.length === 0) {
      return NextResponse.json({ results: [], algorithm: "weighted-intersection" });
    }

    const results = narrowIcd(symptomCodes);

    return NextResponse.json({
      source: "local-csv",
      algorithm: "weighted-intersection",
      inputSymptoms: symptomCodes.length,
      totalResults: results.length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "narrowing_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

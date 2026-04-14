import { NextRequest, NextResponse } from "next/server";
import {
  loadIcdCatalog,
  loadIcdClsMappings,
  loadIcdMedicationMappings,
  loadClsCatalog,
  loadMedicationCatalog,
  loadClaimRiskRules,
} from "../../../utils/csv-loader";

/**
 * CSV-Based Recommendation API (Pilot Phase)
 * All data loaded from local CSV seed files — no Google Sheets dependency.
 */

function parseJsonSafe(value: string) {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function buildRecommendations(diagnosisCodes: string[]) {
  const clsMappings = loadIcdClsMappings();
  const medMappings = loadIcdMedicationMappings();
  const clsCatalog = loadClsCatalog();
  const medCatalog = loadMedicationCatalog();
  const icdCatalog = loadIcdCatalog();
  const riskRules = loadClaimRiskRules();

  // Build diagnoses
  const diagnoses = diagnosisCodes.map((code) => {
    const found = icdCatalog.find((e) => e.code === code);
    return { code, label: found?.name ?? code };
  });

  // Investigations from mapping_icd_cls
  const investigationMap = new Map<string, { name: string; rationale: string; detail: string; mappingNote: string }>();
  clsMappings
    .filter((m) => diagnosisCodes.includes(m.icdCode))
    .sort((a, b) => a.priority - b.priority)
    .forEach((m) => {
      if (investigationMap.has(m.clsCode)) return; // dedupe
      const catalog = clsCatalog.get(m.clsCode);
      investigationMap.set(m.clsCode, {
        name: catalog?.name ?? m.clsCode,
        rationale: m.note,
        detail: catalog?.defaultFrequency ?? "",
        mappingNote: m.note,
      });
    });

  // Medications from mapping_icd_medication
  const medicationMap = new Map<string, { name: string; rationale: string; detail: string; mappingNote: string }>();
  medMappings
    .filter((m) => diagnosisCodes.includes(m.icdCode))
    .sort((a, b) => a.priority - b.priority)
    .forEach((m) => {
      if (medicationMap.has(m.drugCode)) return; // dedupe
      const catalog = medCatalog.get(m.drugCode);
      const detailParts = [catalog?.route ?? "", catalog?.strength ?? ""].filter(Boolean);
      medicationMap.set(m.drugCode, {
        name: catalog?.name ?? m.drugCode,
        rationale: m.note,
        detail: detailParts.join(" / "),
        mappingNote: m.note,
      });
    });

  // Claim risk rules
  const matchedRule = riskRules.find((rule) => {
    const ruleIcds = rule.appliesToIcd.split("|").map((s) => s.trim());
    return diagnosisCodes.some((code) => ruleIcds.includes(code));
  });

  const professionalProfile = parseJsonSafe(matchedRule?.conditionExpression ?? "");

  return {
    diagnoses,
    recommendations: {
      investigationsNote: String(professionalProfile.labPurposeNote ?? ""),
      investigations: Array.from(investigationMap.values()),
      medicationGroupsNote: String(professionalProfile.medicationRoleNote ?? ""),
      medicationGroups: Array.from(medicationMap.values()),
    },
    claimRisk: {
      alerts: [] as { severity: string; title: string; description: string }[],
      warningMessage: matchedRule?.warningMessage ?? "",
      recommendedAction: matchedRule?.recommendedAction ?? "",
      reimbursementNote: String(professionalProfile.reimbursementNote ?? ""),
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const diagnosisCodes: string[] = Array.isArray(payload?.diagnoses)
      ? payload.diagnoses.map((item: { icd?: string }) => String(item?.icd ?? "")).filter(Boolean)
      : [];

    if (diagnosisCodes.length === 0) {
      return NextResponse.json({
        diagnoses: [],
        recommendations: { investigations: [], medicationGroups: [] },
        claimRisk: { alerts: [], warningMessage: "", recommendedAction: "" },
      });
    }

    const result = buildRecommendations(diagnosisCodes);

    // Dynamic Rule Engine integration
    try {
      const { runDecisionEngine } = await import("@app-bhxh/decision-engine");

      const dynamicEngineResult = await runDecisionEngine({
        diagnoses: diagnosisCodes.map((icd: string) => ({ icd })),
        protocols: [
          {
            code: "CSV_PROTOCOL",
            items: [
              ...result.recommendations.investigations.map((i) => ({ type: "CLS", code: i.name, name: i.name })),
              ...result.recommendations.medicationGroups.map((m) => ({ type: "MEDICATION", code: m.name, name: m.name })),
            ],
          },
        ],
        rules: {
          claimRisk: [],
          dynamicRules: [],
        },
      });

      result.claimRisk.alerts = [
        ...result.claimRisk.alerts,
        ...dynamicEngineResult.alerts,
      ];
    } catch (err) {
      console.error("[csv-recommendation] Rule engine error:", err);
    }

    console.log(
      `[csv-recommendation] ICD=${diagnosisCodes.join(",")} → ${result.recommendations.investigations.length} CLS, ${result.recommendations.medicationGroups.length} Meds`
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "recommendation_failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

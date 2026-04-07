import { NextRequest, NextResponse } from "next/server";

const remoteUrl = process.env.GOOGLE_APPS_SCRIPT_URL || process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL;

type WorkbookTabRow = Record<string, unknown>;

// In-memory cache for workbook preview (TTL: 5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;
let workbookCache: { data: unknown; timestamp: number } | null = null;

function parseJsonSafe(value: unknown) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(String(value)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function loadWorkbookPreview() {
  // Return cached data if valid
  if (workbookCache && Date.now() - workbookCache.timestamp < CACHE_TTL_MS) {
    return workbookCache.data;
  }

  const url = new URL(remoteUrl!);
  url.searchParams.set("action", "workbook-preview");
  url.searchParams.set(
    "tabs",
    "catalog_cls,catalog_medication,mapping_icd_cls,mapping_icd_medication,rule_claim_risk"
  );

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Workbook preview returned HTTP ${response.status}`);
  }

  const data = await response.json();
  workbookCache = { data, timestamp: Date.now() };
  return data;
}


function getTabRows(payload: any, tabName: string): WorkbookTabRow[] {
  const tab = Array.isArray(payload?.tabs) ? payload.tabs.find((item: { name?: string }) => item?.name === tabName) : null;
  return Array.isArray(tab?.rows) ? tab.rows : [];
}

function enrichRecommendations(data: any, workbookPreview: any, diagnosisCodes: string[]) {
  const clsCatalogRows = getTabRows(workbookPreview, "catalog_cls");
  const medicationCatalogRows = getTabRows(workbookPreview, "catalog_medication");
  const icdClsMappingRows = getTabRows(workbookPreview, "mapping_icd_cls");
  const icdMedicationMappingRows = getTabRows(workbookPreview, "mapping_icd_medication");
  const ruleRows = getTabRows(workbookPreview, "rule_claim_risk");

  const selectedRule =
    ruleRows.find((row) => diagnosisCodes.includes(String(row.applies_to_icd ?? ""))) ?? null;
  const professionalProfile = parseJsonSafe(selectedRule?.condition_expression);

  const clsCatalogByCode = new Map(
    clsCatalogRows.map((row) => [String(row.cls_code ?? ""), row])
  );
  const medicationCatalogByCode = new Map(
    medicationCatalogRows.map((row) => [String(row.drug_code ?? ""), row])
  );

  const investigationMetaByName = new Map<string, { detail: string; mappingNote: string }>();
  icdClsMappingRows
    .filter((row) => diagnosisCodes.includes(String(row.icd_code ?? "")))
    .sort((left, right) => Number(left.priority ?? 0) - Number(right.priority ?? 0))
    .forEach((row) => {
      const code = String(row.cls_code ?? "");
      const catalog = clsCatalogByCode.get(code) ?? {};
      const name = String((catalog as WorkbookTabRow).cls_name ?? code);

      investigationMetaByName.set(name, {
        detail: String((catalog as WorkbookTabRow).default_frequency ?? ""),
        mappingNote: String(row.note ?? "")
      });
    });

  const medicationMetaByName = new Map<string, { detail: string; mappingNote: string }>();
  icdMedicationMappingRows
    .filter((row) => diagnosisCodes.includes(String(row.icd_code ?? "")))
    .sort((left, right) => Number(left.priority ?? 0) - Number(right.priority ?? 0))
    .forEach((row) => {
      const code = String(row.drug_code ?? "");
      const catalog = medicationCatalogByCode.get(code) ?? {};
      const name = String((catalog as WorkbookTabRow).drug_name ?? code);
      const detailParts = [String((catalog as WorkbookTabRow).route ?? ""), String((catalog as WorkbookTabRow).strength ?? "")].filter(Boolean);

      medicationMetaByName.set(name, {
        detail: detailParts.join(" / "),
        mappingNote: String(row.note ?? "")
      });
    });

  return {
    ...data,
    claimRisk: {
      alerts: [],
      warningMessage: String(selectedRule?.warning_message ?? ""),
      recommendedAction: String(selectedRule?.recommended_action ?? ""),
      reimbursementNote: String(professionalProfile.reimbursementNote ?? "")
    },
    recommendations: {
      ...(data?.recommendations ?? {}),
      investigationsNote: String(professionalProfile.labPurposeNote ?? ""),
      investigations: Array.isArray(data?.recommendations?.investigations)
        ? data.recommendations.investigations.map((item: Record<string, unknown>) => {
            const meta = investigationMetaByName.get(String(item.name ?? ""));
            return {
              ...item,
              detail: meta?.detail ?? "",
              mappingNote: meta?.mappingNote ?? ""
            };
          })
        : [],
      medicationGroupsNote: String(professionalProfile.medicationRoleNote ?? ""),
      medicationGroups: Array.isArray(data?.recommendations?.medicationGroups)
        ? data.recommendations.medicationGroups.map((item: Record<string, unknown>) => {
            const meta = medicationMetaByName.get(String(item.name ?? ""));
            return {
              ...item,
              detail: meta?.detail ?? "",
              mappingNote: meta?.mappingNote ?? ""
            };
          })
        : []
    }
  };
}

export async function POST(request: NextRequest) {
  const payload = await request.json();

  if (!remoteUrl) {
    return NextResponse.json(
      {
        error: "missing_remote_url",
        message: "GOOGLE_APPS_SCRIPT_URL is not configured."
      },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(remoteUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "remote_request_failed",
          status: response.status,
          message: `Apps Script returned HTTP ${response.status}`
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const diagnosisCodes = Array.isArray(payload?.diagnoses)
      ? payload.diagnoses.map((item: { icd?: string }) => String(item?.icd ?? "")).filter(Boolean)
      : [];

    try {
      const workbookPreview = await loadWorkbookPreview();
      const enriched = enrichRecommendations(data, workbookPreview, diagnosisCodes);

      // Tích hợp Dynamic Rule Engine
      const { runDecisionEngine } = await import("@app-bhxh/decision-engine");

      const dynamicEngineResult = await runDecisionEngine({
        diagnoses: diagnosisCodes.map((icd: string) => ({ icd })),
        protocols: [
          {
            code: "MOCK_PROTOCOL",
            items: [
              ...(enriched.recommendations.investigations || []).map((i: any) => ({ type: "CLS", code: i.name, name: i.name })),
              ...(enriched.recommendations.medicationGroups || []).map((m: any) => ({ type: "MEDICATION", code: m.name, name: m.name }))
            ]
          }
        ],
        rules: {
          claimRisk: [],
          dynamicRules: [
            {
              conditions: {
                all: [
                  { fact: "patient", path: "$.diagnoses", operator: "contains", value: "J00" },
                  { fact: "patient", path: "$.investigations", operator: "contains", value: "Siêu âm tim" }
                ]
              },
              event: {
                type: "block",
                params: { message: "Kiểm định tự động (Rule Engine): Không thể kê Siêu âm tim cho hội chứng viêm họng J00." }
              }
            }
          ]
        }
      });

      enriched.claimRisk.alerts = [
        ...enriched.claimRisk.alerts,
        ...dynamicEngineResult.alerts
      ];

      return NextResponse.json(enriched);
    } catch(err) {
      console.error("Route error:", err);
      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "remote_request_exception",
        message: error instanceof Error ? error.message : "Unknown remote error"
      },
      { status: 502 }
    );
  }
}

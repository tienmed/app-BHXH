import type { DiagnosisOption, SuggestedItem, AlertItem, RecommendationState, CostSegment } from "../types";
import { localInvestigations, localMedications, localAlerts } from "../data/fallback-data";

export function buildLocalPreview(selectedCodes: string[], catalog: DiagnosisOption[]): RecommendationState {
    const diagnoses = selectedCodes.map((code) => {
        const found = catalog.find((item) => item.code === code);

        return {
            code,
            label: found?.label ?? code
        };
    });

    const investigationMap = new Map<string, SuggestedItem>();
    const medicationMap = new Map<string, SuggestedItem>();
    const alertMap = new Map<string, AlertItem>();

    selectedCodes.forEach((code) => {
        (localInvestigations[code] ?? []).forEach((item) => investigationMap.set(item.name, item));
        (localMedications[code] ?? []).forEach((item) => medicationMap.set(item.name, item));
        (localAlerts[code] ?? []).forEach((item) => alertMap.set(item.title, item));
    });

    return {
        diagnoses,
        investigations: Array.from(investigationMap.values()),
        medications: Array.from(medicationMap.values()),
        investigationsNote: "",
        medicationsNote: "",
        warningMessage: "",
        recommendedAction: "",
        reimbursementNote: "",
        alerts: Array.from(alertMap.values())
    };
}

export function normalizeRecommendationPayload(payload: unknown): RecommendationState {
    const raw = payload as Record<string, unknown> | null;
    const rawRecommendations = raw?.recommendations as Record<string, unknown> | undefined;
    const rawGuard = raw?.reimbursementGuard as Record<string, unknown> | undefined;
    const rawClaimRisk = raw?.claimRisk as Record<string, unknown> | undefined;
    const rawCostComp = rawGuard?.costComposition as Record<string, unknown> | undefined;

    const diagnoses = (Array.isArray(raw?.diagnoses) ? raw!.diagnoses : []).map((item: Record<string, unknown>) => ({
        code: String(item.code ?? item.icd ?? ""),
        label: String(item.label ?? item.name ?? item.icd ?? "")
    }));

    const investigations = (Array.isArray(rawRecommendations?.investigations) ? rawRecommendations!.investigations : []).map((item: Record<string, unknown>) => ({
        name: String(item.name ?? ""),
        rationale: String(item.rationale ?? ""),
        detail: String(item.detail ?? ""),
        mappingNote: String(item.mappingNote ?? "")
    }));

    const medications = (Array.isArray(rawRecommendations?.medicationGroups) ? rawRecommendations!.medicationGroups : []).map((item: Record<string, unknown>) => ({
        name: String(item.name ?? ""),
        rationale: String(item.rationale ?? ""),
        detail: String(item.detail ?? ""),
        mappingNote: String(item.mappingNote ?? "")
    }));

    const alerts = (Array.isArray(rawGuard?.alerts) ? rawGuard!.alerts : []).map((item: Record<string, unknown>) => ({
        severity: (item.severity ?? "medium") as "high" | "medium" | "low",
        title: String(item.title ?? item.rule_name ?? "Cảnh báo"),
        description: String(item.description ?? item.message ?? item.warning_message ?? "")
    }));

    return {
        diagnoses,
        investigations,
        investigationsNote: String(rawRecommendations?.investigationsNote ?? ""),
        medications,
        medicationsNote: String(rawRecommendations?.medicationGroupsNote ?? ""),
        warningMessage: String(rawClaimRisk?.warningMessage ?? ""),
        recommendedAction: String(rawClaimRisk?.recommendedAction ?? ""),
        reimbursementNote: String(rawClaimRisk?.reimbursementNote ?? ""),
        costComposition: rawCostComp
            ? {
                icd: Number(rawCostComp.icd ?? 0),
                cls: Number(rawCostComp.cls ?? 0),
                medications: Number(rawCostComp.medications ?? 0)
            }
            : undefined,
        alerts
    };
}

export function shouldShowMappingNote(value: string | undefined, groupNote: string | undefined) {
    const normalizedValue = String(value ?? "").trim();
    const normalizedGroup = String(groupNote ?? "").trim();

    if (!normalizedValue) return false;
    if (normalizedValue === normalizedGroup) return false;

    return true;
}

export function shouldShowSupplementalText(value: string | undefined, groupNote: string | undefined, rationale: string | undefined) {
    const normalizedValue = String(value ?? "").trim();
    const normalizedGroup = String(groupNote ?? "").trim();
    const normalizedRationale = String(rationale ?? "").trim();

    if (!normalizedValue) return false;
    if (normalizedValue === normalizedGroup) return false;
    if (normalizedValue === normalizedRationale) return false;

    return true;
}

export function shouldShowDistinctRationale(
    rationale: string | undefined,
    groupNote: string | undefined,
    mappingNote: string | undefined
) {
    const normalizedRationale = String(rationale ?? "").trim();
    const normalizedGroup = String(groupNote ?? "").trim();
    const normalizedMapping = String(mappingNote ?? "").trim();

    if (!normalizedRationale) return false;
    if (normalizedRationale === normalizedGroup) return false;
    if (normalizedRationale === normalizedMapping) return false;

    return true;
}

export function buildCostCompositionSegments(costComposition: RecommendationState["costComposition"]): CostSegment[] {
    const icd = Math.max(0, Number(costComposition?.icd ?? 0));
    const cls = Math.max(0, Number(costComposition?.cls ?? 0));
    const medications = Math.max(0, Number(costComposition?.medications ?? 0));
    const total = icd + cls + medications;

    if (total <= 0) return [];

    return [
        { key: "icd", label: "ICD", raw: icd, width: `${(icd / total) * 100}%` },
        { key: "cls", label: "CLS", raw: cls, width: `${(cls / total) * 100}%` },
        { key: "drug", label: "Thuốc", raw: medications, width: `${(medications / total) * 100}%` }
    ];
}

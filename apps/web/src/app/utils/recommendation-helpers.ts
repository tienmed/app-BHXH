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

export function normalizeRecommendationPayload(payload: any): RecommendationState {
    const diagnoses = (payload?.diagnoses ?? []).map((item: any) => ({
        code: String(item.code ?? item.icd ?? ""),
        label: String(item.label ?? item.name ?? item.icd ?? "")
    }));

    const investigations = (payload?.recommendations?.investigations ?? []).map((item: any) => ({
        name: String(item.name ?? ""),
        rationale: String(item.rationale ?? ""),
        detail: String(item.detail ?? ""),
        mappingNote: String(item.mappingNote ?? "")
    }));

    const medications = (payload?.recommendations?.medicationGroups ?? []).map((item: any) => ({
        name: String(item.name ?? ""),
        rationale: String(item.rationale ?? ""),
        detail: String(item.detail ?? ""),
        mappingNote: String(item.mappingNote ?? "")
    }));

    const alerts = (payload?.reimbursementGuard?.alerts ?? []).map((item: any) => ({
        severity: (item.severity ?? "medium") as "high" | "medium" | "low",
        title: String(item.title ?? item.rule_name ?? "Cảnh báo"),
        description: String(item.description ?? item.message ?? item.warning_message ?? "")
    }));

    return {
        diagnoses,
        investigations,
        investigationsNote: String(payload?.recommendations?.investigationsNote ?? ""),
        medications,
        medicationsNote: String(payload?.recommendations?.medicationGroupsNote ?? ""),
        warningMessage: String(payload?.claimRisk?.warningMessage ?? ""),
        recommendedAction: String(payload?.claimRisk?.recommendedAction ?? ""),
        reimbursementNote: String(payload?.claimRisk?.reimbursementNote ?? ""),
        costComposition: payload?.reimbursementGuard?.costComposition
            ? {
                icd: Number(payload.reimbursementGuard.costComposition.icd ?? 0),
                cls: Number(payload.reimbursementGuard.costComposition.cls ?? 0),
                medications: Number(payload.reimbursementGuard.costComposition.medications ?? 0)
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

export type Diagnosis = {
    code: string;
    label: string;
};

export type DiagnosisOption = {
    code: string;
    label: string;
};

export type SuggestedItem = {
    name: string;
    rationale: string;
    detail?: string;
    mappingNote?: string;
};

export type AlertItem = {
    severity: "high" | "medium" | "low";
    title: string;
    description: string;
};

export type RecommendationState = {
    diagnoses: Diagnosis[];
    investigations: SuggestedItem[];
    investigationsNote?: string;
    medications: SuggestedItem[];
    medicationsNote?: string;
    warningMessage?: string;
    recommendedAction?: string;
    reimbursementNote?: string;
    costComposition?: {
        icd: number;
        cls: number;
        medications: number;
    };
    alerts: AlertItem[];
};

export type ItemStatus = "pending" | "accepted" | "dismissed";

export type FeedbackPayload = {
    icdCode: string;
    icdName: string;
    feedbackType: "not_appropriate" | "missing" | "need_adjustment" | "general";
    targetType: "cls" | "medication" | "alert" | "general";
    targetName: string;
    note: string;
};

export type CostSegment = {
    key: string;
    label: string;
    raw: number;
    width: string;
};

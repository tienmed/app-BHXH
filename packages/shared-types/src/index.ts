export type CareSetting = "outpatient";

export type AlertSeverity = "high" | "medium" | "low";

export interface DiagnosisItem {
  icd: string;
  label: string;
  type: "primary" | "secondary";
}

export interface SuggestedItem {
  name: string;
  rationale: string;
  source: string;
}

export interface RiskAlert {
  severity: AlertSeverity;
  title: string;
  description: string;
}

export interface RecommendationPreview {
  careSetting: CareSetting;
  specialty: string;
  diagnoses: DiagnosisItem[];
  investigations: SuggestedItem[];
  medications: SuggestedItem[];
  alerts: RiskAlert[];
}

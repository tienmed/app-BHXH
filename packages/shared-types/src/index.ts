// ── Common Primitives ──

export type AlertSeverity = "high" | "medium" | "low";
export type CareSetting = "outpatient";
export type ItemStatus = "pending" | "accepted" | "dismissed";
export type LoadingState = null | "refresh" | "template" | "inspect" | "preview" | "save" | "log";

// ── Diagnosis ──

export interface DiagnosisOption {
  code: string;
  label: string;
}

/** Alias kept for backward-compat — `Diagnosis` and `DiagnosisOption` share the same shape. */
export type Diagnosis = DiagnosisOption;

export interface DiagnosisItem {
  icd: string;
  label: string;
  type: "primary" | "secondary";
}

// ── Recommendations (Doctor Web) ──

export interface SuggestedItem {
  name: string;
  rationale: string;
  detail?: string;
  mappingNote?: string;
  /** Only present in shared-types canonical form */
  source?: string;
}

export interface AlertItem {
  severity: AlertSeverity;
  title: string;
  description: string;
}

export interface RecommendationState {
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
}

export interface CostSegment {
  key: string;
  label: string;
  raw: number;
  width: string;
}

export interface FeedbackPayload {
  icdCode: string;
  icdName: string;
  feedbackType: "not_appropriate" | "missing" | "need_adjustment" | "general";
  targetType: "cls" | "medication" | "alert" | "general";
  targetName: string;
  note: string;
}

// ── Risk / Alerts (shared between decision-engine and web) ──

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

// ── Admin Types ──

export interface TemplatePayload {
  workbookName: string;
  tabs: string[];
}

export interface WorkbookInspectPayload {
  workbookName: string;
  workbookId: string;
  ready: boolean;
  tabs: Array<{
    name: string;
    exists: boolean;
    rowCount: number;
    columnCount: number;
    headers: string[];
    missingColumns: string[];
  }>;
}

export type PreviewRow = Record<string, string | number | boolean | null>;

export interface WorkbookPreviewPayload {
  workbookName: string;
  workbookId: string;
  tabs: Array<{
    name: string;
    headers: string[];
    rowCount: number;
    rows: PreviewRow[];
  }>;
}

export interface SelectedRecord {
  tabName: string;
  row: PreviewRow;
}

export interface ChangeLogPayload {
  total: number;
  rows: Array<Record<string, string | number | boolean | null>>;
}

export interface QuickCreateState {
  icdCode: string;
  icdName: string;
  chapter: string;
  protocolName: string;
  protocolStatus: string;
  protocolOwner: string;
  primaryRuleSet: string;
  rulePriorityLevel: string;
  ruleFocus: string;
  ruleIsActive: boolean;
  description: string;
  careSetting: string;
  ageGroup: string;
  visitContext: string;
  triggerSymptoms: string;
  contraindications: string;
  severity: string;
  labPurposeNote: string;
  medicationRoleNote: string;
  warningMessage: string;
  recommendedAction: string;
  reimbursementNote: string;
  note: string;
  systemSupportNote: string;
  icdRatioMax: string;
  clsRatioMax: string;
  drugRatioMax: string;
  clsCodes: string[];
  drugCodes: string[];
  clsMappingNotes: Record<string, string>;
  drugMappingNotes: Record<string, string>;
  clsRepeatFrequencies: Record<string, string>;
}

export interface MappingDetailItem {
  code: string;
  name: string;
  group: string;
  catalogHint: string;
  note: string;
}

export interface CostSuggestionItem {
  key: string;
  title: string;
  description: string;
  icdRatio: string;
  clsRatio: string;
  drugRatio: string;
  tone: "primary" | "reference" | "default";
}

export interface ConfiguredIcdRow {
  code: string;
  name: string;
  chapter: string;
  clsCount: number;
  drugCount: number;
  hasWarning: boolean;
  hasGroupNotes: boolean;
  completeness: number;
  missingItems: string[];
}

export interface ConfiguredCostProfile {
  code: string;
  name: string;
  icdRatio: string;
  clsRatio: string;
  drugRatio: string;
}

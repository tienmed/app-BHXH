export type TemplatePayload = {
    workbookName: string;
    tabs: string[];
};

export type WorkbookInspectPayload = {
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
};

export type PreviewRow = Record<string, string | number | boolean | null>;

export type WorkbookPreviewPayload = {
    workbookName: string;
    workbookId: string;
    tabs: Array<{
        name: string;
        headers: string[];
        rowCount: number;
        rows: PreviewRow[];
    }>;
};

export type SelectedRecord = {
    tabName: string;
    row: PreviewRow;
};

export type ChangeLogPayload = {
    total: number;
    rows: Array<Record<string, string | number | boolean | null>>;
};

export type QuickCreateState = {
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
};

export type MappingDetailItem = {
    code: string;
    name: string;
    group: string;
    catalogHint: string;
    note: string;
};

export type CostSuggestionItem = {
    key: string;
    title: string;
    description: string;
    icdRatio: string;
    clsRatio: string;
    drugRatio: string;
    tone: "primary" | "reference" | "default";
};

export type ConfiguredIcdRow = {
    code: string;
    name: string;
    chapter: string;
    clsCount: number;
    drugCount: number;
    hasWarning: boolean;
    hasGroupNotes: boolean;
    completeness: number;
    missingItems: string[];
};

export type ConfiguredCostProfile = {
    code: string;
    name: string;
    icdRatio: string;
    clsRatio: string;
    drugRatio: string;
};

export type LoadingState = null | "refresh" | "template" | "inspect" | "preview" | "save" | "log";

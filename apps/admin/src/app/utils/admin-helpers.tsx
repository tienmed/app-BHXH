import { Fragment } from "react";
import type {
    QuickCreateState,
    TemplatePayload,
    WorkbookInspectPayload,
    WorkbookPreviewPayload,
    PreviewRow,
    CostSuggestionItem
} from "../types";

export function createEmptyQuickCreate(): QuickCreateState {
    return {
        icdCode: "",
        icdName: "",
        chapter: "Nội khoa",
        protocolName: "",
        protocolStatus: "active",
        protocolOwner: "Phòng khám",
        primaryRuleSet: "claim-basic",
        rulePriorityLevel: "high",
        ruleFocus: "Cảnh báo trước xuất toán",
        ruleIsActive: true,
        description: "",
        careSetting: "Ngoại trú",
        ageGroup: "Người lớn",
        visitContext: "Khám mới hoặc tái khám",
        triggerSymptoms: "",
        contraindications: "",
        severity: "medium",
        labPurposeNote: "",
        medicationRoleNote: "",
        warningMessage: "",
        recommendedAction: "",
        reimbursementNote: "",
        note: "",
        systemSupportNote: "",
        icdRatioMax: "30",
        clsRatioMax: "40",
        drugRatioMax: "30",
        clsCodes: [],
        drugCodes: [],
        clsMappingNotes: {},
        drugMappingNotes: {},
        clsRepeatFrequencies: {}
    };
}

export function parseRuleProfile(value: string | number | boolean | null | undefined) {
    if (!value) {
        return {};
    }

    try {
        return JSON.parse(String(value)) as Partial<QuickCreateState>;
    } catch {
        return {};
    }
}

export function normalizeIcdLookup(code: string) {
    return code.trim().toUpperCase().replace(/\./g, "");
}

export function getPresetCostSuggestion(icdCode: string, icdName: string): CostSuggestionItem {
    const normalizedCode = normalizeIcdLookup(icdCode);
    const normalizedName = icdName.trim();

    const presets: Record<string, Omit<CostSuggestionItem, "key" | "tone">> = {
        I10: {
            title: "Gợi ý cho tăng huyết áp ngoại trú",
            description: "Ưu tiên phần khám, đánh giá nền và thuốc duy trì; CLS ở mức chọn lọc.",
            icdRatio: "40",
            clsRatio: "25",
            drugRatio: "35"
        },
        E119: {
            title: "Gợi ý cho đái tháo đường típ 2",
            description: "Cần cân bằng giữa đánh giá ICD, CLS theo dõi và thuốc nền dài hạn.",
            icdRatio: "35",
            clsRatio: "35",
            drugRatio: "30"
        },
        L02: {
            title: "Gợi ý cho áp xe da / nhọt",
            description: "Ưu tiên khám lâm sàng và thuốc; CLS chỉ mở rộng khi có dấu hiệu nặng.",
            icdRatio: "35",
            clsRatio: "25",
            drugRatio: "40"
        },
        L70: {
            title: "Gợi ý cho mụn trứng cá",
            description: "Đa số dựa trên khám lâm sàng; CLS thấp, thuốc và chăm sóc da chiếm tỷ trọng chính.",
            icdRatio: "55",
            clsRatio: "10",
            drugRatio: "35"
        },
        J00: {
            title: "Gợi ý cho viêm mũi họng cấp thông thường",
            description: "Chẩn đoán chủ yếu bằng lâm sàng, CLS thấp, thuốc triệu chứng ở mức vừa phải.",
            icdRatio: "45",
            clsRatio: "15",
            drugRatio: "40"
        },
        J01: {
            title: "Gợi ý cho viêm xoang cấp",
            description: "Giữ cân bằng giữa đánh giá ICD, CLS chọn lọc và thuốc điều trị triệu chứng / kháng sinh khi cần.",
            icdRatio: "35",
            clsRatio: "30",
            drugRatio: "35"
        },
        E78: {
            title: "Gợi ý cho rối loạn lipid máu",
            description: "Cần bộ xét nghiệm nền hợp lý nhưng vẫn giữ trọng tâm vào đánh giá nguy cơ và thuốc nền.",
            icdRatio: "35",
            clsRatio: "35",
            drugRatio: "30"
        }
    };

    const exactPreset = presets[normalizedCode];

    if (exactPreset) {
        return {
            key: `preset-${normalizedCode}`,
            tone: "primary" as const,
            ...exactPreset
        };
    }

    return {
        key: `preset-default-${normalizedCode || "new"}`,
        title: normalizedName ? `Gợi ý mặc định cho ${normalizedName}` : "Gợi ý mặc định cho ICD mới",
        description: "Dùng khi chưa có cấu hình lịch sử: giữ tương quan cân bằng giữa ICD, CLS và thuốc.",
        icdRatio: "35",
        clsRatio: "30",
        drugRatio: "35",
        tone: "default" as const
    };
}

export function normalizeTemplatePayload(payload: unknown): TemplatePayload {
    const source = payload as Partial<TemplatePayload> | null;

    return {
        workbookName: typeof source?.workbookName === "string" ? source.workbookName : "Chưa rõ tên workbook",
        tabs: Array.isArray(source?.tabs) ? source.tabs.map((item) => String(item)) : []
    };
}

export function normalizeInspectPayload(payload: unknown): WorkbookInspectPayload {
    const source = payload as Partial<WorkbookInspectPayload> | null;

    return {
        workbookName: typeof source?.workbookName === "string" ? source.workbookName : "Chưa rõ tên workbook",
        workbookId: typeof source?.workbookId === "string" ? source.workbookId : "",
        ready: Boolean(source?.ready),
        tabs: Array.isArray(source?.tabs)
            ? source.tabs.map((tab) => ({
                name: typeof tab?.name === "string" ? tab.name : "unknown_tab",
                exists: Boolean(tab?.exists),
                rowCount: Number(tab?.rowCount ?? 0),
                columnCount: Number(tab?.columnCount ?? 0),
                headers: Array.isArray(tab?.headers) ? tab.headers.map((item) => String(item)) : [],
                missingColumns: Array.isArray(tab?.missingColumns) ? tab.missingColumns.map((item) => String(item)) : []
            }))
            : []
    };
}

export function normalizePreviewPayload(payload: unknown): WorkbookPreviewPayload {
    const source = payload as Partial<WorkbookPreviewPayload> | null;

    return {
        workbookName: typeof source?.workbookName === "string" ? source.workbookName : "Chưa rõ tên workbook",
        workbookId: typeof source?.workbookId === "string" ? source.workbookId : "",
        tabs: Array.isArray(source?.tabs)
            ? source.tabs.map((tab) => ({
                name: typeof tab?.name === "string" ? tab.name : "unknown_tab",
                headers: Array.isArray(tab?.headers) ? tab.headers.map((item) => String(item)) : [],
                rowCount: Number(tab?.rowCount ?? 0),
                rows: Array.isArray(tab?.rows)
                    ? tab.rows.map((row) =>
                        Object.fromEntries(
                            Object.entries((row ?? {}) as Record<string, unknown>).map(([key, value]) => [
                                key,
                                value === undefined ? "" : String(value)
                            ])
                        )
                    )
                    : []
            }))
            : []
    };
}

export function formatCellValue(value: string | number | boolean | null | undefined) {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    return String(value);
}

export function highlightText(value: string, keyword: string) {
    if (!keyword) {
        return value;
    }

    const lowerValue = value.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const matches: Array<{ start: number; end: number }> = [];
    let cursor = 0;

    while (cursor < value.length) {
        const index = lowerValue.indexOf(lowerKeyword, cursor);

        if (index < 0) {
            break;
        }

        matches.push({ start: index, end: index + keyword.length });
        cursor = index + keyword.length;
    }

    if (matches.length === 0) {
        return value;
    }

    const parts: React.ReactNode[] = [];
    let lastEnd = 0;

    matches.forEach((match, index) => {
        if (match.start > lastEnd) {
            parts.push(<Fragment key={`text-${index}`}> { value.slice(lastEnd, match.start) } </Fragment>);
}

parts.push(
    <mark className="cellHighlight" key = {`mark-${index}`}>
    { value.slice(match.start, match.end) }
</mark>
);
lastEnd = match.end;
  });

if (lastEnd < value.length) {
    parts.push(<Fragment key="text-end" > { value.slice(lastEnd) } </Fragment>);
}

return parts;
}

export function getPrimaryCode(row: PreviewRow) {
    const codeFields = ["icd_code", "cls_code", "drug_code", "rule_code", "protocol_code"];

    for (const field of codeFields) {
        const value = row[field];

        if (value) {
            return String(value);
        }
    }

    return null;
}

export function getPrimaryKeyField(row: PreviewRow) {
    const codeFields = ["icd_code", "cls_code", "drug_code", "rule_code", "protocol_code"];

    for (const field of codeFields) {
        if (row[field]) {
            return field;
        }
    }

    const firstField = Object.keys(row)[0];
    return firstField ?? null;
}

export function buildCatalogHint(parts: Array<string | null | undefined>) {
    return parts
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
        .join(" • ");
}

export function escapeCsv(value: string) {
    if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
}

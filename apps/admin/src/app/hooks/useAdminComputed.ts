"use client";

import { useMemo } from "react";
import type {
    WorkbookPreviewPayload,
    ChangeLogPayload,
    QuickCreateState,
    ConfiguredIcdRow,
    ConfiguredCostProfile,
    MappingDetailItem,
    CostSuggestionItem,
    PreviewRow,
} from "../types";
import {
    parseRuleProfile,
    getPresetCostSuggestion,
    buildCatalogHint,
    formatCellValue,
    escapeCsv,
} from "../utils/admin-helpers";
import { tabLabels } from "../data/constants";

interface ComputedDeps {
    preview: WorkbookPreviewPayload | null;
    changeLog: ChangeLogPayload | null;
    quickCreate: QuickCreateState;
    activeIcdCode: string;
    selectedPreviewTab: string;
    searchTerm: string;
    logTabFilter: string;
    logKeyword: string;
    icdSearchTerm: string;
    setCopyStatus: (status: string) => void;
    // Pre-extracted tab rows from orchestrator
    icdCatalogRows: PreviewRow[];
    clsCatalogRows: PreviewRow[];
    medicationCatalogRows: PreviewRow[];
    icdClsMappingRows: PreviewRow[];
    icdMedicationMappingRows: PreviewRow[];
    claimRiskRows: PreviewRow[];
    protocolHeaderRows: PreviewRow[];
    costCompositionRows: PreviewRow[];
}

export function useAdminComputed(deps: ComputedDeps) {
    const normalizedSearchTerm = deps.searchTerm.trim().toLowerCase();
    const normalizedLogKeyword = deps.logKeyword.trim().toLowerCase();

    // ── Catalog row lookups (from deps) ──
    const {
        clsCatalogRows,
        medicationCatalogRows,
        icdCatalogRows,
        icdClsMappingRows,
        icdMedicationMappingRows,
        claimRiskRows,
        protocolHeaderRows,
        costCompositionRows,
    } = deps;

    // ── Filtered preview tabs ──
    const filteredPreviewTabs = useMemo(() => {
        return (deps.preview?.tabs ?? [])
            .filter((tab) => deps.selectedPreviewTab === "all" || tab.name === deps.selectedPreviewTab)
            .map((tab) => {
                const filteredRows = normalizedSearchTerm
                    ? tab.rows.filter((row) =>
                        tab.headers.some((header) =>
                            String(row[header] ?? "").toLowerCase().includes(normalizedSearchTerm)
                        )
                    )
                    : tab.rows;

                return { ...tab, filteredRows };
            })
            .filter((tab) => normalizedSearchTerm === "" || tab.filteredRows.length > 0);
    }, [normalizedSearchTerm, deps.preview, deps.selectedPreviewTab]);

    // ── Filtered change log ──
    const filteredChangeLogRows = useMemo(() => {
        return (deps.changeLog?.rows ?? []).filter((row) => {
            const tabMatched = deps.logTabFilter === "all" || String(row.tab_name ?? "") === deps.logTabFilter;
            const keywordMatched =
                normalizedLogKeyword === "" ||
                Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(normalizedLogKeyword));

            return tabMatched && keywordMatched;
        });
    }, [deps.changeLog?.rows, deps.logTabFilter, normalizedLogKeyword]);

    const totalPreviewRows = (deps.preview?.tabs ?? []).reduce((sum, tab) => sum + tab.rowCount, 0);
    const latestChangedTab = filteredChangeLogRows[0]?.tab_name
        ? String(filteredChangeLogRows[0].tab_name)
        : "Chưa có log";

    // ── Selected labels ──
    const selectedClsLabels = clsCatalogRows
        .filter((row) => deps.quickCreate.clsCodes.includes(String(row.cls_code ?? "")))
        .map((row) => String(row.cls_name ?? row.cls_code ?? ""))
        .filter(Boolean);

    const selectedDrugLabels = medicationCatalogRows
        .filter((row) => deps.quickCreate.drugCodes.includes(String(row.drug_code ?? "")))
        .map((row) => String(row.drug_name ?? row.drug_code ?? ""))
        .filter(Boolean);

    // ── Selected details ──
    const selectedClsDetails: MappingDetailItem[] = deps.quickCreate.clsCodes.map((code) => {
        const row = clsCatalogRows.find((item) => String(item.cls_code ?? "") === code);
        return {
            code,
            name: String(row?.cls_name ?? code),
            group: String(row?.cls_group ?? ""),
            catalogHint: buildCatalogHint([String(row?.unit ?? ""), String(row?.default_frequency ?? "")]),
            note: deps.quickCreate.clsMappingNotes[code] ?? "",
        };
    });

    const selectedDrugDetails: MappingDetailItem[] = deps.quickCreate.drugCodes.map((code) => {
        const row = medicationCatalogRows.find((item) => String(item.drug_code ?? "") === code);
        return {
            code,
            name: String(row?.drug_name ?? code),
            group: String(row?.drug_group ?? ""),
            catalogHint: buildCatalogHint([String(row?.route ?? ""), String(row?.strength ?? "")]),
            note: deps.quickCreate.drugMappingNotes[code] ?? "",
        };
    });

    // ── Configured ICD rows ──
    const configuredIcdRows: ConfiguredIcdRow[] = useMemo(() => {
        const mappedClsCodes = new Set(icdClsMappingRows.map((row) => String(row.icd_code ?? "")));
        const mappedDrugCodes = new Set(icdMedicationMappingRows.map((row) => String(row.icd_code ?? "")));
        const ruledCodes = new Set(claimRiskRows.map((row) => String(row.applies_to_icd ?? "")));

        return icdCatalogRows
            .filter((row) => {
                const code = String(row.icd_code ?? "");
                return code && (mappedClsCodes.has(code) || mappedDrugCodes.has(code) || ruledCodes.has(code));
            })
            .map((row) => {
                const code = String(row.icd_code ?? "");
                const ruleRow = claimRiskRows.find((item) => String(item.applies_to_icd ?? "") === code);
                const profile = parseRuleProfile(ruleRow?.condition_expression);
                const clsCount = icdClsMappingRows.filter((item) => String(item.icd_code ?? "") === code).length;
                const drugCount = icdMedicationMappingRows.filter((item) => String(item.icd_code ?? "") === code).length;
                const completeness = [
                    clsCount > 0,
                    drugCount > 0,
                    Boolean(String(ruleRow?.warning_message ?? "").trim()),
                    Boolean(
                        String(profile.labPurposeNote ?? "").trim() || String(profile.medicationRoleNote ?? "").trim()
                    ),
                ].filter(Boolean).length;

                return {
                    code,
                    name: String(row.icd_name ?? ""),
                    chapter: String(row.chapter ?? ""),
                    clsCount,
                    drugCount,
                    hasWarning: Boolean(String(ruleRow?.warning_message ?? "").trim()),
                    hasGroupNotes: Boolean(
                        String(profile.labPurposeNote ?? "").trim() || String(profile.medicationRoleNote ?? "").trim()
                    ),
                    completeness,
                    missingItems: [
                        clsCount > 0 ? null : "thiếu CLS",
                        drugCount > 0 ? null : "thiếu thuốc",
                        String(ruleRow?.warning_message ?? "").trim() ? null : "thiếu cảnh báo",
                        String(profile.labPurposeNote ?? "").trim() || String(profile.medicationRoleNote ?? "").trim()
                            ? null
                            : "thiếu ghi chú nhóm",
                    ].filter(Boolean) as string[],
                };
            })
            .sort((left, right) => left.code.localeCompare(right.code));
    }, [claimRiskRows, icdCatalogRows, icdClsMappingRows, icdMedicationMappingRows]);

    // ── Cost profiles ──
    const configuredCostProfiles: ConfiguredCostProfile[] = useMemo(() => {
        return configuredIcdRows
            .map((row) => {
                const costRuleRow = costCompositionRows.find(
                    (item) =>
                        String(item.scope_type ?? "").toLowerCase() === "icd" &&
                        String(item.scope_code ?? "") === row.code
                );

                if (!costRuleRow) return null;

                return {
                    code: row.code,
                    name: row.name,
                    icdRatio: String(costRuleRow.icd_ratio_max ?? ""),
                    clsRatio: String(costRuleRow.cls_ratio_max ?? ""),
                    drugRatio: String(costRuleRow.drug_ratio_max ?? ""),
                };
            })
            .filter(Boolean) as ConfiguredCostProfile[];
    }, [configuredIcdRows, costCompositionRows]);

    // ── Filtered configured ICD rows ──
    const filteredConfiguredIcdRows = useMemo(() => {
        const normalizedKeyword = deps.icdSearchTerm.trim().toLowerCase();
        if (!normalizedKeyword) return [];

        return configuredIcdRows.filter(
            (row) => row.code.toLowerCase().includes(normalizedKeyword) || row.name.toLowerCase().includes(normalizedKeyword)
        );
    }, [configuredIcdRows, deps.icdSearchTerm]);

    // ── Cost total ──
    const activeCostTotal =
        Number.parseInt(deps.quickCreate.icdRatioMax || "0", 10) +
        Number.parseInt(deps.quickCreate.clsRatioMax || "0", 10) +
        Number.parseInt(deps.quickCreate.drugRatioMax || "0", 10);

    // ── Cost suggestions ──
    const costSuggestions = useMemo(() => {
        const suggestions: CostSuggestionItem[] = [];
        const seen = new Set<string>();
        const preset = getPresetCostSuggestion(deps.quickCreate.icdCode, deps.quickCreate.icdName);

        suggestions.push(preset);
        seen.add(preset.key);

        configuredCostProfiles
            .filter(
                (item) =>
                    item.code !== deps.activeIcdCode &&
                    item.code !== deps.quickCreate.icdCode.trim().toUpperCase()
            )
            .slice(0, 4)
            .forEach((item) => {
                const key = `reference-${item.code}`;
                if (seen.has(key)) return;

                suggestions.push({
                    key,
                    title: `${item.code} - ${item.name || "ICD đã cấu hình"}`,
                    description: "Tham chiếu từ ICD đã có cấu hình cơ cấu chi phí trong hệ thống.",
                    icdRatio: item.icdRatio,
                    clsRatio: item.clsRatio,
                    drugRatio: item.drugRatio,
                    tone: "reference",
                });
                seen.add(key);
            });

        if (suggestions.length === 1) {
            suggestions.push({
                key: "reference-default-balance",
                title: "Mẫu cân bằng ICD + CLS + thuốc",
                description: "Điểm khởi đầu an toàn khi chưa có ICD tương tự để đối chiếu.",
                icdRatio: "35",
                clsRatio: "30",
                drugRatio: "35",
                tone: "default",
            });
        }

        return suggestions;
    }, [deps.activeIcdCode, configuredCostProfiles, deps.quickCreate.icdCode, deps.quickCreate.icdName]);

    // ── Summary cards ──
    const summaryCards = [
        {
            label: "ICD đã tạo",
            value: String(configuredIcdRows.length),
            note: "Tổng số hồ sơ bệnh đã được thiết lập",
        },
        {
            label: "Dòng dữ liệu pilot",
            value: deps.preview ? String(totalPreviewRows) : "—",
            note: "Tổng dòng ở các tab trọng tâm",
        },
        {
            label: "Lịch sử thay đổi",
            value: deps.changeLog ? String(deps.changeLog.total) : "—",
            note: "Số bản ghi log đang theo dõi",
        },
        {
            label: "Tab đổi gần nhất",
            value: latestChangedTab,
            note: "Lấy từ lịch sử thay đổi gần đây",
        },
    ];

    // ── CSV export ──
    function exportFilteredCsv() {
        if (filteredPreviewTabs.length === 0) {
            deps.setCopyStatus("Không có dữ liệu để xuất CSV.");
            return;
        }

        const lines: string[] = [];

        filteredPreviewTabs.forEach((tab) => {
            lines.push(`# ${tabLabels[tab.name] ?? tab.name}`);
            lines.push(tab.headers.map(escapeCsv).join(","));

            tab.filteredRows.forEach((row) => {
                lines.push(tab.headers.map((header) => escapeCsv(formatCellValue(row[header]))).join(","));
            });

            lines.push("");
        });

        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        const suffix = deps.selectedPreviewTab === "all" ? "tat-ca-tab" : deps.selectedPreviewTab;

        anchor.href = url;
        anchor.download = `app-bhxh-${suffix}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        deps.setCopyStatus("Đã xuất CSV theo bộ lọc hiện tại.");
    }

    return {
        normalizedSearchTerm,
        normalizedLogKeyword,
        filteredPreviewTabs,
        filteredChangeLogRows,
        clsCatalogRows,
        medicationCatalogRows,
        icdCatalogRows,
        icdClsMappingRows,
        icdMedicationMappingRows,
        claimRiskRows,
        protocolHeaderRows,
        costCompositionRows,
        configuredIcdRows,
        configuredCostProfiles,
        filteredConfiguredIcdRows,
        activeCostTotal,
        costSuggestions,
        summaryCards,
        selectedClsLabels,
        selectedDrugLabels,
        selectedClsDetails,
        selectedDrugDetails,
        exportFilteredCsv,
    };
}

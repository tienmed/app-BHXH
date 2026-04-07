"use client";

import { useEffect, useMemo, useState } from "react";
import type {
    TemplatePayload,
    WorkbookInspectPayload,
    WorkbookPreviewPayload,
    SelectedRecord,
    ChangeLogPayload,
    QuickCreateState,
    MappingDetailItem,
    CostSuggestionItem,
    ConfiguredIcdRow,
    ConfiguredCostProfile,
    PreviewRow,
    LoadingState
} from "../types";
import { previewTabs, tabLabels } from "../data/constants";
import {
    createEmptyQuickCreate,
    parseRuleProfile,
    normalizeIcdLookup,
    getPresetCostSuggestion,
    normalizeTemplatePayload,
    normalizeInspectPayload,
    normalizePreviewPayload,
    formatCellValue,
    getPrimaryKeyField,
    buildCatalogHint,
    escapeCsv
} from "../utils/admin-helpers";

export function useAdminWorkspace() {
    const [isMounted, setIsMounted] = useState(false);
    const [dragState, setDragState] = useState<{ kind: "cls" | "drug"; dragIndex: number; overIndex: number } | null>(null);
    const [template, setTemplate] = useState<TemplatePayload | null>(null);
    const [inspect, setInspect] = useState<WorkbookInspectPayload | null>(null);
    const [preview, setPreview] = useState<WorkbookPreviewPayload | null>(null);
    const [selectedPreviewTab, setSelectedPreviewTab] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [copyStatus, setCopyStatus] = useState("");
    const [status, setStatus] = useState("Sẵn sàng kiểm tra cấu trúc dữ liệu Google Sheets.");
    const [loading, setLoading] = useState<LoadingState>(null);
    const [selectedRecord, setSelectedRecord] = useState<SelectedRecord | null>(null);
    const [editDraft, setEditDraft] = useState<Record<string, string>>({});
    const [saveNote, setSaveNote] = useState("");
    const [changeLog, setChangeLog] = useState<ChangeLogPayload | null>(null);
    const [logTabFilter, setLogTabFilter] = useState("all");
    const [logKeyword, setLogKeyword] = useState("");
    const [icdSearchTerm, setIcdSearchTerm] = useState("");
    const [activeIcdCode, setActiveIcdCode] = useState("");
    const [technicalOpen, setTechnicalOpen] = useState(false);
    const [quickCreate, setQuickCreate] = useState<QuickCreateState>(createEmptyQuickCreate);
    const [quickAddCls, setQuickAddCls] = useState({
        name: "",
        group: "Xét nghiệm bổ sung",
        unit: "",
        defaultFrequency: "",
        note: ""
    });
    const [quickAddMedication, setQuickAddMedication] = useState({
        name: "",
        group: "Thuốc bổ sung",
        route: "",
        strength: "",
        note: ""
    });
    const [lastCreatedCatalogEntry, setLastCreatedCatalogEntry] = useState<{
        kind: "cls" | "medication";
        code: string;
        name: string;
    } | null>(null);

    // ── Actions ──

    async function loadTemplate() {
        setLoading("template");
        setStatus("Đang lấy mẫu cấu trúc workbook từ Apps Script...");

        try {
            const response = await fetch("/api/google-sheets/template", { cache: "no-store" });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.message ?? `HTTP ${response.status}`);
            }

            setTemplate(normalizeTemplatePayload(payload));
            setStatus("Đã lấy được mẫu tab kỳ vọng từ Apps Script.");
        } catch (error) {
            setStatus(`Không thể lấy template từ Apps Script. ${(error as Error).message}`);
        } finally {
            setLoading(null);
        }
    }

    async function inspectWorkbook() {
        setLoading("inspect");
        setStatus("Đang kiểm tra cấu trúc workbook Google Sheet...");

        try {
            const response = await fetch("/api/google-sheets/workbook-inspect", { cache: "no-store" });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.message ?? `HTTP ${response.status}`);
            }

            const normalized = normalizeInspectPayload(payload);
            setInspect(normalized);
            setStatus(
                normalized.ready
                    ? "Workbook đã đủ cấu trúc cơ bản cho pilot."
                    : "Workbook còn thiếu tab hoặc thiếu cột cần thiết."
            );
        } catch (error) {
            setStatus(`Không thể kiểm tra workbook. ${(error as Error).message}`);
        } finally {
            setLoading(null);
        }
    }

    async function loadPreview() {
        setLoading("preview");
        setStatus("Đang lấy dữ liệu mẫu trực tiếp từ Google Sheet...");

        try {
            const response = await fetch(`/api/google-sheets/workbook-preview?tabs=${previewTabs.join(",")}`, {
                cache: "no-store"
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.message ?? `HTTP ${response.status}`);
            }

            setPreview(normalizePreviewPayload(payload));
            setSelectedPreviewTab("all");
            setSelectedRecord(null);
            setEditDraft({});
            setSaveNote("");
            setCopyStatus("");
            setStatus("Đã tải dữ liệu thật từ Google Sheet để rà soát nhanh trong màn quản trị.");
        } catch (error) {
            setStatus(`Không thể lấy dữ liệu thật từ Google Sheet. ${(error as Error).message}`);
        } finally {
            setLoading(null);
        }
    }

    async function copyCode(value: string) {
        try {
            await navigator.clipboard.writeText(value);
            setCopyStatus(`Đã copy mã ${value}.`);
        } catch {
            setCopyStatus(`Không thể copy mã ${value}.`);
        }
    }

    async function loadChangeLog() {
        setLoading("log");
        setStatus("Đang tải lịch sử thay đổi từ Google Sheet...");

        try {
            const response = await fetch("/api/google-sheets/change-log?limit=20", {
                cache: "no-store"
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.message ?? `HTTP ${response.status}`);
            }

            setChangeLog({
                total: Number(payload?.total ?? 0),
                rows: Array.isArray(payload?.rows)
                    ? payload.rows.map((row: Record<string, unknown>) =>
                        Object.fromEntries(
                            Object.entries(row ?? {}).map(([key, value]) => [key, value === undefined ? "" : String(value)])
                        )
                    )
                    : []
            });
            setStatus("Đã tải lịch sử thay đổi gần nhất.");
        } catch (error) {
            setStatus(`Không thể tải lịch sử thay đổi. ${(error as Error).message}`);
        } finally {
            setLoading(null);
        }
    }

    async function refreshAll() {
        setLoading("refresh");
        setStatus("Đang làm mới toàn bộ dữ liệu quản trị...");

        try {
            const [templateResponse, inspectResponse, previewResponse, logResponse] = await Promise.all([
                fetch("/api/google-sheets/template", { cache: "no-store" }),
                fetch("/api/google-sheets/workbook-inspect", { cache: "no-store" }),
                fetch(`/api/google-sheets/workbook-preview?tabs=${previewTabs.join(",")}`, { cache: "no-store" }),
                fetch("/api/google-sheets/change-log?limit=20", { cache: "no-store" })
            ]);

            const [templatePayload, inspectPayload, previewPayload, logPayload] = await Promise.all([
                templateResponse.json(),
                inspectResponse.json(),
                previewResponse.json(),
                logResponse.json()
            ]);

            setTemplate(normalizeTemplatePayload(templatePayload));
            setInspect(normalizeInspectPayload(inspectPayload));
            setPreview(normalizePreviewPayload(previewPayload));
            setChangeLog({
                total: Number(logPayload?.total ?? 0),
                rows: Array.isArray(logPayload?.rows)
                    ? logPayload.rows.map((row: Record<string, unknown>) =>
                        Object.fromEntries(
                            Object.entries(row ?? {}).map(([key, value]) => [key, value === undefined ? "" : String(value)])
                        )
                    )
                    : []
            });
            setStatus("Đã làm mới toàn bộ dashboard quản trị.");
        } catch (error) {
            setStatus(`Không thể làm mới dashboard. ${(error as Error).message}`);
        } finally {
            setLoading(null);
        }
    }

    function exportFilteredCsv() {
        if (filteredPreviewTabs.length === 0) {
            setCopyStatus("Không có dữ liệu để xuất CSV.");
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
        const suffix = selectedPreviewTab === "all" ? "tat-ca-tab" : selectedPreviewTab;

        anchor.href = url;
        anchor.download = `app-bhxh-${suffix}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        setCopyStatus("Đã xuất CSV theo bộ lọc hiện tại.");
    }

    function openRecord(tabName: string, row: PreviewRow) {
        const normalizedDraft = Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, value === null || value === undefined ? "" : String(value)])
        );

        setSelectedRecord({ tabName, row });
        setEditDraft(normalizedDraft);
        setSaveNote("");
    }

    function resetDraft() {
        if (!selectedRecord) {
            return;
        }

        setEditDraft(
            Object.fromEntries(
                Object.entries(selectedRecord.row).map(([key, value]) => [key, value === null || value === undefined ? "" : String(value)])
            )
        );
        setSaveNote("");
    }

    async function saveRecord() {
        if (!selectedRecord) {
            return;
        }

        const keyField = getPrimaryKeyField(selectedRecord.row);
        const keyValue = keyField ? selectedRecord.row[keyField] : null;

        if (!keyField || keyValue === null || keyValue === undefined || keyValue === "") {
            setStatus("Không xác định được khóa chính để cập nhật bản ghi này.");
            return;
        }

        setLoading("save");
        setStatus("Đang lưu thay đổi về Google Sheet...");

        try {
            const response = await fetch("/api/google-sheets/update-record", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tabName: selectedRecord.tabName,
                    keyField,
                    keyValue: String(keyValue),
                    updates: editDraft,
                    actor: "admin-ui",
                    note: saveNote
                })
            });

            const payload = await response.json();

            if (!response.ok || payload?.ok === false) {
                throw new Error(payload?.message ?? `HTTP ${response.status}`);
            }

            const updatedRow = payload?.updatedRow
                ? Object.fromEntries(
                    Object.entries(payload.updatedRow as Record<string, unknown>).map(([key, value]) => [
                        key,
                        value === undefined ? "" : String(value)
                    ])
                )
                : editDraft;

            setPreview((current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    tabs: current.tabs.map((tab) => {
                        if (tab.name !== selectedRecord.tabName) {
                            return tab;
                        }

                        return {
                            ...tab,
                            rows: tab.rows.map((row) =>
                                String(row[keyField] ?? "") === String(keyValue) ? updatedRow : row
                            )
                        };
                    })
                };
            });

            setSelectedRecord({
                tabName: selectedRecord.tabName,
                row: updatedRow
            });
            setEditDraft(updatedRow);
            setCopyStatus("Đã lưu thay đổi và cập nhật log trên Google Sheet.");
            setStatus(payload?.message ?? "Đã lưu thay đổi thành công.");
        } catch (error) {
            setStatus(`Không thể lưu thay đổi. ${(error as Error).message}`);
        } finally {
            setLoading(null);
        }
    }

    async function createQuickBundle() {
        if (!quickCreate.icdCode.trim() || !quickCreate.icdName.trim()) {
            setStatus("Cần nhập mã ICD và tên ICD trước khi tạo mới.");
            return;
        }

        setLoading("save");
        setStatus("Đang tạo nhanh cấu hình cho ICD mới...");

        try {
            const response = await fetch("/api/google-sheets/create-icd-rule-bundle", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...quickCreate,
                    clsSelections: quickCreate.clsCodes.map((code, index) => ({
                        code,
                        note: quickCreate.clsMappingNotes[code] ?? "",
                        repeatFrequency: quickCreate.clsRepeatFrequencies[code] ?? "",
                        mappingType: "recommended",
                        priority: index + 1
                    })),
                    drugSelections: quickCreate.drugCodes.map((code, index) => ({
                        code,
                        note: quickCreate.drugMappingNotes[code] ?? "",
                        mappingType: "preferred",
                        priority: index + 1
                    })),
                    actor: "admin-ui"
                })
            });
            const payload = await response.json();

            if (!response.ok || payload?.ok === false) {
                throw new Error(payload?.message ?? `HTTP ${response.status}`);
            }

            setStatus(payload?.message ?? "Đã tạo nhanh cấu hình cho ICD mới.");
            setCopyStatus(`Đã nạp mới ICD ${quickCreate.icdCode}.`);
            setActiveIcdCode(quickCreate.icdCode);
            await refreshAll();
        } catch (error) {
            setStatus(`Không thể tạo nhanh ICD mới. ${(error as Error).message}`);
        } finally {
            setLoading(null);
        }
    }

    async function createCatalogEntry(kind: "cls" | "medication") {
        const payload =
            kind === "cls"
                ? {
                    kind,
                    ...quickAddCls,
                    actor: "admin-ui"
                }
                : {
                    kind,
                    ...quickAddMedication,
                    actor: "admin-ui"
                };

        if (!payload.name.trim()) {
            setStatus(
                kind === "cls"
                    ? "Cần nhập tên cho xét nghiệm/thăm dò mới."
                    : "Cần nhập tên cho thuốc/nhóm thuốc mới."
            );
            return;
        }

        setLoading("save");
        setStatus(
            kind === "cls"
                ? "Đang thêm xét nghiệm/thăm dò mới vào danh mục..."
                : "Đang thêm thuốc/nhóm thuốc mới vào danh mục..."
        );

        try {
            const response = await fetch("/api/google-sheets/create-catalog-entry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (!response.ok || result?.ok === false) {
                throw new Error(result?.message ?? `HTTP ${response.status}`);
            }

            const generatedCode = String(result?.code ?? "");
            const generatedName = String(result?.name ?? payload.name);

            setLastCreatedCatalogEntry({ kind, code: generatedCode, name: generatedName });

            if (generatedCode) {
                if (kind === "cls") {
                    setQuickCreate((current) => ({
                        ...current,
                        clsCodes: current.clsCodes.includes(generatedCode)
                            ? current.clsCodes
                            : [...current.clsCodes, generatedCode]
                    }));
                    setQuickAddCls({ name: "", group: "Xét nghiệm bổ sung", unit: "", defaultFrequency: "", note: "" });
                } else {
                    setQuickCreate((current) => ({
                        ...current,
                        drugCodes: current.drugCodes.includes(generatedCode)
                            ? current.drugCodes
                            : [...current.drugCodes, generatedCode]
                    }));
                    setQuickAddMedication({ name: "", group: "Thuốc bổ sung", route: "", strength: "", note: "" });
                }
            }

            setCopyStatus(result?.message ?? `Đã thêm ${generatedName} vào danh mục.`);
            setStatus(result?.message ?? `Đã thêm mục mới vào danh mục ${kind === "cls" ? "cận lâm sàng" : "thuốc"}.`);
            await refreshAll();
        } catch (error) {
            setStatus(`Không thể thêm mục mới. ${(error as Error).message}`);
        } finally {
            setLoading(null);
        }
    }

    function applyCostSuggestion(suggestion: CostSuggestionItem) {
        setQuickCreate((current) => ({
            ...current,
            icdRatioMax: suggestion.icdRatio,
            clsRatioMax: suggestion.clsRatio,
            drugRatioMax: suggestion.drugRatio
        }));
        setStatus(`Đã áp dụng gợi ý cơ cấu chi phí: ICD ${suggestion.icdRatio}% - CLS ${suggestion.clsRatio}% - Thuốc ${suggestion.drugRatio}%.`);
    }

    function loadIcdIntoForm(icdCode: string) {
        const normalizedCode = normalizeIcdLookup(icdCode);
        setActiveIcdCode(normalizedCode);

        const icdRow = icdCatalogRows.find((row) => String(row.icd_code ?? "") === normalizedCode);
        const ruleRow = claimRiskRows.find((row) => String(row.applies_to_icd ?? "") === normalizedCode);
        const profile = parseRuleProfile(ruleRow?.condition_expression);
        const selectedCls = icdClsMappingRows
            .filter((row) => String(row.icd_code ?? "") === normalizedCode)
            .map((row) => String(row.cls_code ?? ""))
            .filter(Boolean);
        const selectedDrugs = icdMedicationMappingRows
            .filter((row) => String(row.icd_code ?? "") === normalizedCode)
            .map((row) => String(row.drug_code ?? ""))
            .filter(Boolean);

        const clsNotesMap: Record<string, string> = {};
        const clsFreqMap: Record<string, string> = {};

        icdClsMappingRows
            .filter((row) => String(row.icd_code ?? "") === normalizedCode)
            .forEach((row) => {
                const code = String(row.cls_code ?? "");
                if (code) {
                    clsNotesMap[code] = String(row.mapping_note ?? "");
                    clsFreqMap[code] = String(row.repeat_frequency ?? "");
                }
            });

        const drugNotesMap: Record<string, string> = {};

        icdMedicationMappingRows
            .filter((row) => String(row.icd_code ?? "") === normalizedCode)
            .forEach((row) => {
                const code = String(row.drug_code ?? "");
                if (code) {
                    drugNotesMap[code] = String(row.mapping_note ?? "");
                }
            });

        const costRow = costCompositionRows.find(
            (row) =>
                String(row.scope_type ?? "").toLowerCase() === "icd" && String(row.scope_code ?? "") === normalizedCode
        );

        const protocolRow = protocolHeaderRows.find(
            (row) => String(row.applies_to_icd ?? "") === normalizedCode
        );

        setQuickCreate({
            icdCode: normalizedCode,
            icdName: String(icdRow?.icd_name ?? ""),
            chapter: String(icdRow?.chapter ?? "Nội khoa"),
            protocolName: String(protocolRow?.protocol_name ?? ""),
            protocolStatus: String(protocolRow?.status ?? "active"),
            protocolOwner: String(protocolRow?.owner ?? "Phòng khám"),
            primaryRuleSet: String(profile.primaryRuleSet ?? "claim-basic"),
            rulePriorityLevel: String(profile.rulePriorityLevel ?? "high"),
            ruleFocus: String(profile.ruleFocus ?? "Cảnh báo trước xuất toán"),
            ruleIsActive: profile.ruleIsActive !== false,
            description: String(profile.description ?? ""),
            careSetting: String(profile.careSetting ?? "Ngoại trú"),
            ageGroup: String(profile.ageGroup ?? "Người lớn"),
            visitContext: String(profile.visitContext ?? "Khám mới hoặc tái khám"),
            triggerSymptoms: String(profile.triggerSymptoms ?? ""),
            contraindications: String(profile.contraindications ?? ""),
            severity: String(ruleRow?.severity ?? profile.severity ?? "medium"),
            labPurposeNote: String(profile.labPurposeNote ?? ""),
            medicationRoleNote: String(profile.medicationRoleNote ?? ""),
            warningMessage: String(ruleRow?.warning_message ?? ""),
            recommendedAction: String(ruleRow?.recommended_action ?? profile.recommendedAction ?? ""),
            reimbursementNote: String(ruleRow?.reimbursement_note ?? profile.reimbursementNote ?? ""),
            note: String(ruleRow?.note ?? profile.note ?? ""),
            systemSupportNote: String(profile.systemSupportNote ?? ""),
            icdRatioMax: String(costRow?.icd_ratio_max ?? "30"),
            clsRatioMax: String(costRow?.cls_ratio_max ?? "40"),
            drugRatioMax: String(costRow?.drug_ratio_max ?? "30"),
            clsCodes: selectedCls,
            drugCodes: selectedDrugs,
            clsMappingNotes: clsNotesMap,
            drugMappingNotes: drugNotesMap,
            clsRepeatFrequencies: clsFreqMap
        });

        setStatus(`Đã tải hồ sơ ${normalizedCode} vào form.`);
    }

    // ── Computed (must be before effects that use them) ──

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const normalizedLogKeyword = logKeyword.trim().toLowerCase();

    const filteredPreviewTabs = useMemo(() => {
        return (preview?.tabs ?? [])
            .filter((tab) => selectedPreviewTab === "all" || tab.name === selectedPreviewTab)
            .map((tab) => {
                const filteredRows = normalizedSearchTerm
                    ? tab.rows.filter((row) =>
                        tab.headers.some((header) => String(row[header] ?? "").toLowerCase().includes(normalizedSearchTerm))
                    )
                    : tab.rows;

                return {
                    ...tab,
                    filteredRows
                };
            })
            .filter((tab) => normalizedSearchTerm === "" || tab.filteredRows.length > 0);
    }, [normalizedSearchTerm, preview, selectedPreviewTab]);

    const filteredChangeLogRows = useMemo(() => {
        return (changeLog?.rows ?? []).filter((row) => {
            const tabMatched = logTabFilter === "all" || String(row.tab_name ?? "") === logTabFilter;
            const keywordMatched =
                normalizedLogKeyword === "" ||
                Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(normalizedLogKeyword));

            return tabMatched && keywordMatched;
        });
    }, [changeLog?.rows, logTabFilter, normalizedLogKeyword]);

    const totalPreviewRows = (preview?.tabs ?? []).reduce((sum, tab) => sum + tab.rowCount, 0);
    const latestChangedTab = filteredChangeLogRows[0]?.tab_name ? String(filteredChangeLogRows[0].tab_name) : "Chưa có log";

    const clsCatalogRows = (preview?.tabs ?? []).find((tab) => tab.name === "catalog_cls")?.rows ?? [];
    const medicationCatalogRows = (preview?.tabs ?? []).find((tab) => tab.name === "catalog_medication")?.rows ?? [];
    const icdCatalogRows = (preview?.tabs ?? []).find((tab) => tab.name === "catalog_icd")?.rows ?? [];
    const icdClsMappingRows = (preview?.tabs ?? []).find((tab) => tab.name === "mapping_icd_cls")?.rows ?? [];
    const icdMedicationMappingRows = (preview?.tabs ?? []).find((tab) => tab.name === "mapping_icd_medication")?.rows ?? [];
    const claimRiskRows = (preview?.tabs ?? []).find((tab) => tab.name === "rule_claim_risk")?.rows ?? [];
    const protocolHeaderRows = (preview?.tabs ?? []).find((tab) => tab.name === "protocol_header")?.rows ?? [];
    const costCompositionRows = (preview?.tabs ?? []).find((tab) => tab.name === "rule_cost_composition")?.rows ?? [];

    const selectedClsLabels = clsCatalogRows
        .filter((row) => quickCreate.clsCodes.includes(String(row.cls_code ?? "")))
        .map((row) => String(row.cls_name ?? row.cls_code ?? ""))
        .filter(Boolean);

    const selectedDrugLabels = medicationCatalogRows
        .filter((row) => quickCreate.drugCodes.includes(String(row.drug_code ?? "")))
        .map((row) => String(row.drug_name ?? row.drug_code ?? ""))
        .filter(Boolean);

    const selectedClsDetails: MappingDetailItem[] = quickCreate.clsCodes.map((code) => {
        const row = clsCatalogRows.find((item) => String(item.cls_code ?? "") === code);

        return {
            code,
            name: String(row?.cls_name ?? code),
            group: String(row?.cls_group ?? ""),
            catalogHint: buildCatalogHint([String(row?.unit ?? ""), String(row?.default_frequency ?? "")]),
            note: quickCreate.clsMappingNotes[code] ?? ""
        };
    });

    const selectedDrugDetails: MappingDetailItem[] = quickCreate.drugCodes.map((code) => {
        const row = medicationCatalogRows.find((item) => String(item.drug_code ?? "") === code);

        return {
            code,
            name: String(row?.drug_name ?? code),
            group: String(row?.drug_group ?? ""),
            catalogHint: buildCatalogHint([String(row?.route ?? ""), String(row?.strength ?? "")]),
            note: quickCreate.drugMappingNotes[code] ?? ""
        };
    });

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
                    Boolean(String(profile.labPurposeNote ?? "").trim() || String(profile.medicationRoleNote ?? "").trim())
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
                            : "thiếu ghi chú nhóm"
                    ].filter(Boolean) as string[]
                };
            })
            .sort((left, right) => left.code.localeCompare(right.code));
    }, [claimRiskRows, icdCatalogRows, icdClsMappingRows, icdMedicationMappingRows]);

    const configuredCostProfiles: ConfiguredCostProfile[] = useMemo(() => {
        return configuredIcdRows
            .map((row) => {
                const costRuleRow = costCompositionRows.find(
                    (item) => String(item.scope_type ?? "").toLowerCase() === "icd" && String(item.scope_code ?? "") === row.code
                );

                if (!costRuleRow) {
                    return null;
                }

                return {
                    code: row.code,
                    name: row.name,
                    icdRatio: String(costRuleRow.icd_ratio_max ?? ""),
                    clsRatio: String(costRuleRow.cls_ratio_max ?? ""),
                    drugRatio: String(costRuleRow.drug_ratio_max ?? "")
                };
            })
            .filter(Boolean) as ConfiguredCostProfile[];
    }, [configuredIcdRows, costCompositionRows]);

    const filteredConfiguredIcdRows = useMemo(() => {
        const normalizedKeyword = icdSearchTerm.trim().toLowerCase();

        if (!normalizedKeyword) {
            return [];
        }

        return configuredIcdRows.filter(
            (row) => row.code.toLowerCase().includes(normalizedKeyword) || row.name.toLowerCase().includes(normalizedKeyword)
        );
    }, [configuredIcdRows, icdSearchTerm]);

    const activeCostTotal =
        Number.parseInt(quickCreate.icdRatioMax || "0", 10) +
        Number.parseInt(quickCreate.clsRatioMax || "0", 10) +
        Number.parseInt(quickCreate.drugRatioMax || "0", 10);

    const costSuggestions = useMemo(() => {
        const suggestions: CostSuggestionItem[] = [];
        const seen = new Set<string>();
        const preset = getPresetCostSuggestion(quickCreate.icdCode, quickCreate.icdName);

        suggestions.push(preset);
        seen.add(preset.key);

        configuredCostProfiles
            .filter((item) => item.code !== activeIcdCode && item.code !== quickCreate.icdCode.trim().toUpperCase())
            .slice(0, 4)
            .forEach((item) => {
                const key = `reference-${item.code}`;

                if (seen.has(key)) {
                    return;
                }

                suggestions.push({
                    key,
                    title: `${item.code} - ${item.name || "ICD đã cấu hình"}`,
                    description: "Tham chiếu từ ICD đã có cấu hình cơ cấu chi phí trong hệ thống.",
                    icdRatio: item.icdRatio,
                    clsRatio: item.clsRatio,
                    drugRatio: item.drugRatio,
                    tone: "reference"
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
                tone: "default"
            });
        }

        return suggestions;
    }, [activeIcdCode, configuredCostProfiles, quickCreate.icdCode, quickCreate.icdName]);

    const summaryCards = [
        {
            label: "ICD đã tạo",
            value: String(configuredIcdRows.length),
            note: "Tổng số hồ sơ bệnh đã được thiết lập"
        },
        {
            label: "Dòng dữ liệu pilot",
            value: preview ? String(totalPreviewRows) : "—",
            note: "Tổng dòng ở các tab trọng tâm"
        },
        {
            label: "Lịch sử thay đổi",
            value: changeLog ? String(changeLog.total) : "—",
            note: "Số bản ghi log đang theo dõi"
        },
        {
            label: "Tab đổi gần nhất",
            value: latestChangedTab,
            note: "Lấy từ lịch sử thay đổi gần đây"
        }
    ];

    // ── Effects ──

    useEffect(() => {
        void refreshAll();
    }, []);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const normalizedCode = quickCreate.icdCode.trim().toUpperCase();

        if (!normalizedCode || normalizedCode === activeIcdCode) {
            return;
        }

        const existingIcd = configuredIcdRows.find((row) => row.code === normalizedCode);

        if (existingIcd) {
            loadIcdIntoForm(normalizedCode);
        }
    }, [activeIcdCode, configuredIcdRows, quickCreate.icdCode]);

    return {
        // State
        isMounted,
        dragState,
        setDragState,
        template,
        inspect,
        preview,
        selectedPreviewTab,
        setSelectedPreviewTab,
        searchTerm,
        setSearchTerm,
        copyStatus,
        status,
        loading,
        selectedRecord,
        editDraft,
        setEditDraft,
        saveNote,
        setSaveNote,
        changeLog,
        logTabFilter,
        setLogTabFilter,
        logKeyword,
        setLogKeyword,
        icdSearchTerm,
        setIcdSearchTerm,
        activeIcdCode,
        setActiveIcdCode,
        technicalOpen,
        setTechnicalOpen,
        quickCreate,
        setQuickCreate,
        quickAddCls,
        setQuickAddCls,
        quickAddMedication,
        setQuickAddMedication,
        lastCreatedCatalogEntry,

        // Actions
        loadTemplate,
        inspectWorkbook,
        loadPreview,
        copyCode,
        loadChangeLog,
        refreshAll,
        exportFilteredCsv,
        openRecord,
        resetDraft,
        saveRecord,
        createQuickBundle,
        createCatalogEntry,
        applyCostSuggestion,
        loadIcdIntoForm,

        // Computed
        normalizedSearchTerm,
        normalizedLogKeyword,
        filteredPreviewTabs,
        filteredChangeLogRows,
        clsCatalogRows,
        medicationCatalogRows,
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

        // Helpers for clearing
        createEmptyQuickCreate
    };
}

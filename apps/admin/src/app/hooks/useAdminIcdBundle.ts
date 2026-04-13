"use client";

import { useState } from "react";
import type {
    QuickCreateState,
    CostSuggestionItem,
    PreviewRow,
    LoadingState,
} from "../types";
import {
    createEmptyQuickCreate,
    parseRuleProfile,
    normalizeIcdLookup,
    buildCatalogHint,
} from "../utils/admin-helpers";

interface IcdBundleDeps {
    setLoading: React.Dispatch<React.SetStateAction<LoadingState>>;
    setStatus: (status: string) => void;
    setCopyStatus: (status: string) => void;
    refreshAll: () => Promise<void>;
    // Data sources from preview
    icdCatalogRows: PreviewRow[];
    claimRiskRows: PreviewRow[];
    icdClsMappingRows: PreviewRow[];
    icdMedicationMappingRows: PreviewRow[];
    costCompositionRows: PreviewRow[];
    protocolHeaderRows: PreviewRow[];
}

export function useAdminIcdBundle(deps: IcdBundleDeps) {
    const [activeIcdCode, setActiveIcdCode] = useState("");
    const [quickCreate, setQuickCreate] = useState<QuickCreateState>(createEmptyQuickCreate);
    const [quickAddCls, setQuickAddCls] = useState({
        name: "",
        group: "Xét nghiệm bổ sung",
        unit: "",
        defaultFrequency: "",
        note: "",
    });
    const [quickAddMedication, setQuickAddMedication] = useState({
        name: "",
        group: "Thuốc bổ sung",
        route: "",
        strength: "",
        note: "",
    });
    const [lastCreatedCatalogEntry, setLastCreatedCatalogEntry] = useState<{
        kind: "cls" | "medication";
        code: string;
        name: string;
    } | null>(null);

    function applyCostSuggestion(suggestion: CostSuggestionItem) {
        setQuickCreate((current) => ({
            ...current,
            icdRatioMax: suggestion.icdRatio,
            clsRatioMax: suggestion.clsRatio,
            drugRatioMax: suggestion.drugRatio,
        }));
        deps.setStatus(
            `Đã áp dụng gợi ý cơ cấu chi phí: ICD ${suggestion.icdRatio}% - CLS ${suggestion.clsRatio}% - Thuốc ${suggestion.drugRatio}%.`
        );
    }

    function loadIcdIntoForm(icdCode: string) {
        const normalizedCode = normalizeIcdLookup(icdCode);
        setActiveIcdCode(normalizedCode);

        const icdRow = deps.icdCatalogRows.find((row) => String(row.icd_code ?? "") === normalizedCode);
        const ruleRow = deps.claimRiskRows.find((row) => String(row.applies_to_icd ?? "") === normalizedCode);
        const profile = parseRuleProfile(ruleRow?.condition_expression);
        const selectedCls = deps.icdClsMappingRows
            .filter((row) => String(row.icd_code ?? "") === normalizedCode)
            .map((row) => String(row.cls_code ?? ""))
            .filter(Boolean);
        const selectedDrugs = deps.icdMedicationMappingRows
            .filter((row) => String(row.icd_code ?? "") === normalizedCode)
            .map((row) => String(row.drug_code ?? ""))
            .filter(Boolean);

        const clsNotesMap: Record<string, string> = {};
        const clsFreqMap: Record<string, string> = {};

        deps.icdClsMappingRows
            .filter((row) => String(row.icd_code ?? "") === normalizedCode)
            .forEach((row) => {
                const code = String(row.cls_code ?? "");
                if (code) {
                    clsNotesMap[code] = String(row.mapping_note ?? "");
                    clsFreqMap[code] = String(row.repeat_frequency ?? "");
                }
            });

        const drugNotesMap: Record<string, string> = {};

        deps.icdMedicationMappingRows
            .filter((row) => String(row.icd_code ?? "") === normalizedCode)
            .forEach((row) => {
                const code = String(row.drug_code ?? "");
                if (code) {
                    drugNotesMap[code] = String(row.mapping_note ?? "");
                }
            });

        const costRow = deps.costCompositionRows.find(
            (row) =>
                String(row.scope_type ?? "").toLowerCase() === "icd" && String(row.scope_code ?? "") === normalizedCode
        );

        const protocolRow = deps.protocolHeaderRows.find(
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
            clsRepeatFrequencies: clsFreqMap,
        });

        deps.setStatus(`Đã tải hồ sơ ${normalizedCode} vào form.`);
    }

    async function createQuickBundle() {
        if (!quickCreate.icdCode.trim() || !quickCreate.icdName.trim()) {
            deps.setStatus("Cần nhập mã ICD và tên ICD trước khi tạo mới.");
            return;
        }

        deps.setLoading("save");
        deps.setStatus("Đang tạo nhanh cấu hình cho ICD mới...");

        try {
            const response = await fetch("/api/google-sheets/create-icd-rule-bundle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...quickCreate,
                    clsSelections: quickCreate.clsCodes.map((code, index) => ({
                        code,
                        note: quickCreate.clsMappingNotes[code] ?? "",
                        repeatFrequency: quickCreate.clsRepeatFrequencies[code] ?? "",
                        mappingType: "recommended",
                        priority: index + 1,
                    })),
                    drugSelections: quickCreate.drugCodes.map((code, index) => ({
                        code,
                        note: quickCreate.drugMappingNotes[code] ?? "",
                        mappingType: "preferred",
                        priority: index + 1,
                    })),
                    actor: "admin-ui",
                }),
            });
            const payload = await response.json();

            if (!response.ok || payload?.ok === false) {
                throw new Error(payload?.message ?? `HTTP ${response.status}`);
            }

            deps.setStatus(payload?.message ?? "Đã tạo nhanh cấu hình cho ICD mới.");
            deps.setCopyStatus(`Đã nạp mới ICD ${quickCreate.icdCode}.`);
            setActiveIcdCode(quickCreate.icdCode);
            await deps.refreshAll();
        } catch (error) {
            deps.setStatus(`Không thể tạo nhanh ICD mới. ${(error as Error).message}`);
        } finally {
            deps.setLoading(null);
        }
    }

    async function createCatalogEntry(kind: "cls" | "medication") {
        const payload =
            kind === "cls"
                ? { kind, ...quickAddCls, actor: "admin-ui" }
                : { kind, ...quickAddMedication, actor: "admin-ui" };

        if (!payload.name.trim()) {
            deps.setStatus(
                kind === "cls"
                    ? "Cần nhập tên cho xét nghiệm/thăm dò mới."
                    : "Cần nhập tên cho thuốc/nhóm thuốc mới."
            );
            return;
        }

        deps.setLoading("save");
        deps.setStatus(
            kind === "cls"
                ? "Đang thêm xét nghiệm/thăm dò mới vào danh mục..."
                : "Đang thêm thuốc/nhóm thuốc mới vào danh mục..."
        );

        try {
            const response = await fetch("/api/google-sheets/create-catalog-entry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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
                            : [...current.clsCodes, generatedCode],
                    }));
                    setQuickAddCls({ name: "", group: "Xét nghiệm bổ sung", unit: "", defaultFrequency: "", note: "" });
                } else {
                    setQuickCreate((current) => ({
                        ...current,
                        drugCodes: current.drugCodes.includes(generatedCode)
                            ? current.drugCodes
                            : [...current.drugCodes, generatedCode],
                    }));
                    setQuickAddMedication({ name: "", group: "Thuốc bổ sung", route: "", strength: "", note: "" });
                }
            }

            deps.setCopyStatus(result?.message ?? `Đã thêm ${generatedName} vào danh mục.`);
            deps.setStatus(result?.message ?? `Đã thêm mục mới vào danh mục ${kind === "cls" ? "cận lâm sàng" : "thuốc"}.`);
            await deps.refreshAll();
        } catch (error) {
            deps.setStatus(`Không thể thêm mục mới. ${(error as Error).message}`);
        } finally {
            deps.setLoading(null);
        }
    }

    return {
        activeIcdCode,
        setActiveIcdCode,
        quickCreate,
        setQuickCreate,
        quickAddCls,
        setQuickAddCls,
        quickAddMedication,
        setQuickAddMedication,
        lastCreatedCatalogEntry,

        applyCostSuggestion,
        loadIcdIntoForm,
        createQuickBundle,
        createCatalogEntry,

        // Re-export for convenience
        createEmptyQuickCreate,
    };
}

"use client";

import { useEffect, useState } from "react";
import type { PreviewRow, WorkbookPreviewPayload } from "../types";
import { useAdminDataLoader } from "./useAdminDataLoader";
import { useAdminRecordEditor } from "./useAdminRecordEditor";
import { useAdminIcdBundle } from "./useAdminIcdBundle";
import { useAdminComputed } from "./useAdminComputed";
import { createEmptyQuickCreate } from "../utils/admin-helpers";

/** Extract rows from a named tab in the preview payload */
function getTabRows(preview: WorkbookPreviewPayload | null, tabName: string): PreviewRow[] {
    return preview?.tabs?.find((tab) => tab.name === tabName)?.rows ?? [];
}

export function useAdminWorkspace() {
    const [isMounted, setIsMounted] = useState(false);
    const [dragState, setDragState] = useState<{ kind: "cls" | "drug"; dragIndex: number; overIndex: number } | null>(null);
    const [selectedPreviewTab, setSelectedPreviewTab] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [logTabFilter, setLogTabFilter] = useState("all");
    const [logKeyword, setLogKeyword] = useState("");
    const [icdSearchTerm, setIcdSearchTerm] = useState("");
    const [technicalOpen, setTechnicalOpen] = useState(false);

    // ── Sub-hooks ──
    const dataLoader = useAdminDataLoader();

    // Derive tab rows once, pass to both icdBundle and computed
    const icdCatalogRows = getTabRows(dataLoader.preview, "catalog_icd");
    const clsCatalogRows = getTabRows(dataLoader.preview, "catalog_cls");
    const medicationCatalogRows = getTabRows(dataLoader.preview, "catalog_medication");
    const icdClsMappingRows = getTabRows(dataLoader.preview, "mapping_icd_cls");
    const icdMedicationMappingRows = getTabRows(dataLoader.preview, "mapping_icd_medication");
    const claimRiskRows = getTabRows(dataLoader.preview, "rule_claim_risk");
    const protocolHeaderRows = getTabRows(dataLoader.preview, "protocol_header");
    const costCompositionRows = getTabRows(dataLoader.preview, "rule_cost_composition");

    const icdBundle = useAdminIcdBundle({
        setLoading: dataLoader.setLoading,
        setStatus: dataLoader.setStatus,
        setCopyStatus: dataLoader.setCopyStatus,
        refreshAll: dataLoader.refreshAll,
        icdCatalogRows,
        claimRiskRows,
        icdClsMappingRows,
        icdMedicationMappingRows,
        costCompositionRows,
        protocolHeaderRows,
    });

    const recordEditor = useAdminRecordEditor({
        setPreview: dataLoader.setPreview,
        setLoading: dataLoader.setLoading,
        setStatus: dataLoader.setStatus,
        setCopyStatus: dataLoader.setCopyStatus,
    });

    const computed = useAdminComputed({
        preview: dataLoader.preview,
        changeLog: dataLoader.changeLog,
        quickCreate: icdBundle.quickCreate,
        activeIcdCode: icdBundle.activeIcdCode,
        selectedPreviewTab,
        searchTerm,
        logTabFilter,
        logKeyword,
        icdSearchTerm,
        setCopyStatus: dataLoader.setCopyStatus,
        icdCatalogRows,
        clsCatalogRows,
        medicationCatalogRows,
        icdClsMappingRows,
        icdMedicationMappingRows,
        claimRiskRows,
        protocolHeaderRows,
        costCompositionRows,
    });

    // ── Effects ──
    useEffect(() => {
        void dataLoader.refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const normalizedCode = icdBundle.quickCreate.icdCode.trim().toUpperCase();
        if (!normalizedCode || normalizedCode === icdBundle.activeIcdCode) return;

        const existingIcd = computed.configuredIcdRows.find((row) => row.code === normalizedCode);
        if (existingIcd) {
            icdBundle.loadIcdIntoForm(normalizedCode);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [icdBundle.activeIcdCode, computed.configuredIcdRows, icdBundle.quickCreate.icdCode]);

    return {
        // State
        isMounted,
        dragState,
        setDragState,
        template: dataLoader.template,
        inspect: dataLoader.inspect,
        preview: dataLoader.preview,
        selectedPreviewTab,
        setSelectedPreviewTab,
        searchTerm,
        setSearchTerm,
        copyStatus: dataLoader.copyStatus,
        status: dataLoader.status,
        loading: dataLoader.loading,
        selectedRecord: recordEditor.selectedRecord,
        editDraft: recordEditor.editDraft,
        setEditDraft: recordEditor.setEditDraft,
        saveNote: recordEditor.saveNote,
        setSaveNote: recordEditor.setSaveNote,
        changeLog: dataLoader.changeLog,
        logTabFilter,
        setLogTabFilter,
        logKeyword,
        setLogKeyword,
        icdSearchTerm,
        setIcdSearchTerm,
        activeIcdCode: icdBundle.activeIcdCode,
        setActiveIcdCode: icdBundle.setActiveIcdCode,
        technicalOpen,
        setTechnicalOpen,
        quickCreate: icdBundle.quickCreate,
        setQuickCreate: icdBundle.setQuickCreate,
        quickAddCls: icdBundle.quickAddCls,
        setQuickAddCls: icdBundle.setQuickAddCls,
        quickAddMedication: icdBundle.quickAddMedication,
        setQuickAddMedication: icdBundle.setQuickAddMedication,
        lastCreatedCatalogEntry: icdBundle.lastCreatedCatalogEntry,

        // Actions
        loadTemplate: dataLoader.loadTemplate,
        inspectWorkbook: dataLoader.inspectWorkbook,
        loadPreview: dataLoader.loadPreview,
        copyCode: dataLoader.copyCode,
        loadChangeLog: dataLoader.loadChangeLog,
        refreshAll: dataLoader.refreshAll,
        exportFilteredCsv: computed.exportFilteredCsv,
        openRecord: recordEditor.openRecord,
        resetDraft: recordEditor.resetDraft,
        saveRecord: recordEditor.saveRecord,
        createQuickBundle: icdBundle.createQuickBundle,
        createCatalogEntry: icdBundle.createCatalogEntry,
        applyCostSuggestion: icdBundle.applyCostSuggestion,
        loadIcdIntoForm: icdBundle.loadIcdIntoForm,

        // Computed
        normalizedSearchTerm: computed.normalizedSearchTerm,
        normalizedLogKeyword: computed.normalizedLogKeyword,
        filteredPreviewTabs: computed.filteredPreviewTabs,
        filteredChangeLogRows: computed.filteredChangeLogRows,
        clsCatalogRows,
        medicationCatalogRows,
        configuredIcdRows: computed.configuredIcdRows,
        configuredCostProfiles: computed.configuredCostProfiles,
        filteredConfiguredIcdRows: computed.filteredConfiguredIcdRows,
        activeCostTotal: computed.activeCostTotal,
        costSuggestions: computed.costSuggestions,
        summaryCards: computed.summaryCards,
        selectedClsLabels: computed.selectedClsLabels,
        selectedDrugLabels: computed.selectedDrugLabels,
        selectedClsDetails: computed.selectedClsDetails,
        selectedDrugDetails: computed.selectedDrugDetails,

        // Helpers
        createEmptyQuickCreate,
    };
}

"use client";

import { useState } from "react";
import type {
    SelectedRecord,
    PreviewRow,
    WorkbookPreviewPayload,
    LoadingState,
} from "../types";
import { getPrimaryKeyField } from "../utils/admin-helpers";

interface RecordEditorDeps {
    setPreview: React.Dispatch<React.SetStateAction<WorkbookPreviewPayload | null>>;
    setLoading: React.Dispatch<React.SetStateAction<LoadingState>>;
    setStatus: (status: string) => void;
    setCopyStatus: (status: string) => void;
}

export function useAdminRecordEditor(deps: RecordEditorDeps) {
    const [selectedRecord, setSelectedRecord] = useState<SelectedRecord | null>(null);
    const [editDraft, setEditDraft] = useState<Record<string, string>>({});
    const [saveNote, setSaveNote] = useState("");

    function openRecord(tabName: string, row: PreviewRow) {
        const normalizedDraft = Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, value === null || value === undefined ? "" : String(value)])
        );

        setSelectedRecord({ tabName, row });
        setEditDraft(normalizedDraft);
        setSaveNote("");
    }

    function resetDraft() {
        if (!selectedRecord) return;

        setEditDraft(
            Object.fromEntries(
                Object.entries(selectedRecord.row).map(([key, value]) => [
                    key,
                    value === null || value === undefined ? "" : String(value),
                ])
            )
        );
        setSaveNote("");
    }

    async function saveRecord() {
        if (!selectedRecord) return;

        const keyField = getPrimaryKeyField(selectedRecord.row);
        const keyValue = keyField ? selectedRecord.row[keyField] : null;

        if (!keyField || keyValue === null || keyValue === undefined || keyValue === "") {
            deps.setStatus("Không xác định được khóa chính để cập nhật bản ghi này.");
            return;
        }

        deps.setLoading("save");
        deps.setStatus("Đang lưu thay đổi về Google Sheet...");

        try {
            const response = await fetch("/api/google-sheets/update-record", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tabName: selectedRecord.tabName,
                    keyField,
                    keyValue: String(keyValue),
                    updates: editDraft,
                    actor: "admin-ui",
                    note: saveNote,
                }),
            });

            const payload = await response.json();

            if (!response.ok || payload?.ok === false) {
                throw new Error(payload?.message ?? `HTTP ${response.status}`);
            }

            const updatedRow = payload?.updatedRow
                ? Object.fromEntries(
                    Object.entries(payload.updatedRow as Record<string, unknown>).map(([key, value]) => [
                        key,
                        value === undefined ? "" : String(value),
                    ])
                )
                : editDraft;

            deps.setPreview((current) => {
                if (!current) return current;

                return {
                    ...current,
                    tabs: current.tabs.map((tab) => {
                        if (tab.name !== selectedRecord.tabName) return tab;

                        return {
                            ...tab,
                            rows: tab.rows.map((row) =>
                                String(row[keyField] ?? "") === String(keyValue) ? updatedRow : row
                            ),
                        };
                    }),
                };
            });

            setSelectedRecord({ tabName: selectedRecord.tabName, row: updatedRow });
            setEditDraft(updatedRow);
            deps.setCopyStatus("Đã lưu thay đổi và cập nhật log trên Google Sheet.");
            deps.setStatus(payload?.message ?? "Đã lưu thay đổi thành công.");
        } catch (error) {
            deps.setStatus(`Không thể lưu thay đổi. ${(error as Error).message}`);
        } finally {
            deps.setLoading(null);
        }
    }

    return {
        selectedRecord,
        setSelectedRecord,
        editDraft,
        setEditDraft,
        saveNote,
        setSaveNote,

        openRecord,
        resetDraft,
        saveRecord,
    };
}

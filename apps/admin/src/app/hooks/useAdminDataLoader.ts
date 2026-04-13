"use client";

import { useState } from "react";
import type {
    TemplatePayload,
    WorkbookInspectPayload,
    WorkbookPreviewPayload,
    ChangeLogPayload,
    LoadingState,
    PreviewRow,
} from "../types";
import { previewTabs } from "../data/constants";
import {
    normalizeTemplatePayload,
    normalizeInspectPayload,
    normalizePreviewPayload,
} from "../utils/admin-helpers";

export interface AdminDataState {
    template: TemplatePayload | null;
    inspect: WorkbookInspectPayload | null;
    preview: WorkbookPreviewPayload | null;
    changeLog: ChangeLogPayload | null;
    loading: LoadingState;
    status: string;
    copyStatus: string;
}

function normalizeChangeLogPayload(payload: unknown): ChangeLogPayload {
    const raw = payload as Record<string, unknown> | null;
    return {
        total: Number(raw?.total ?? 0),
        rows: Array.isArray(raw?.rows)
            ? (raw!.rows as Array<Record<string, unknown>>).map((row) =>
                Object.fromEntries(
                    Object.entries(row ?? {}).map(([key, value]) => [
                        key,
                        value === undefined ? "" : String(value),
                    ])
                )
            )
            : [],
    };
}

export function useAdminDataLoader() {
    const [template, setTemplate] = useState<TemplatePayload | null>(null);
    const [inspect, setInspect] = useState<WorkbookInspectPayload | null>(null);
    const [preview, setPreview] = useState<WorkbookPreviewPayload | null>(null);
    const [changeLog, setChangeLog] = useState<ChangeLogPayload | null>(null);
    const [loading, setLoading] = useState<LoadingState>(null);
    const [status, setStatus] = useState("Sẵn sàng kiểm tra cấu trúc dữ liệu Google Sheets.");
    const [copyStatus, setCopyStatus] = useState("");

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
                cache: "no-store",
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.message ?? `HTTP ${response.status}`);
            }

            setPreview(normalizePreviewPayload(payload));
            setCopyStatus("");
            setStatus("Đã tải dữ liệu thật từ Google Sheet để rà soát nhanh trong màn quản trị.");
        } catch (error) {
            setStatus(`Không thể lấy dữ liệu thật từ Google Sheet. ${(error as Error).message}`);
        } finally {
            setLoading(null);
        }
    }

    async function loadChangeLog() {
        setLoading("log");
        setStatus("Đang tải lịch sử thay đổi từ Google Sheet...");

        try {
            const response = await fetch("/api/google-sheets/change-log?limit=20", {
                cache: "no-store",
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.message ?? `HTTP ${response.status}`);
            }

            setChangeLog(normalizeChangeLogPayload(payload));
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
                fetch("/api/google-sheets/change-log?limit=20", { cache: "no-store" }),
            ]);

            const [templatePayload, inspectPayload, previewPayload, logPayload] = await Promise.all([
                templateResponse.json(),
                inspectResponse.json(),
                previewResponse.json(),
                logResponse.json(),
            ]);

            setTemplate(normalizeTemplatePayload(templatePayload));
            setInspect(normalizeInspectPayload(inspectPayload));
            setPreview(normalizePreviewPayload(previewPayload));
            setChangeLog(normalizeChangeLogPayload(logPayload));
            setStatus("Đã làm mới toàn bộ dashboard quản trị.");
        } catch (error) {
            setStatus(`Không thể làm mới dashboard. ${(error as Error).message}`);
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

    return {
        // State
        template,
        inspect,
        preview,
        setPreview,
        changeLog,
        loading,
        setLoading,
        status,
        setStatus,
        copyStatus,
        setCopyStatus,

        // Actions
        loadTemplate,
        inspectWorkbook,
        loadPreview,
        loadChangeLog,
        refreshAll,
        copyCode,
    };
}

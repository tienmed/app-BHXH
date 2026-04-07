"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { DiagnosisOption, RecommendationState, ItemStatus, FeedbackPayload, CostSegment } from "../types";
import { defaultDiagnosisOptions, emptyState } from "../data/fallback-data";
import { buildLocalPreview, normalizeRecommendationPayload, buildCostCompositionSegments } from "../utils/recommendation-helpers";

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

export function useDiagnosisWorkspace() {
    const [diagnosisCatalog, setDiagnosisCatalog] = useState<DiagnosisOption[]>(defaultDiagnosisOptions);
    const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [state, setState] = useState<RecommendationState>(emptyState);
    const [status, setStatus] = useState("Sẵn sàng tra ICD.");
    const [loading, setLoading] = useState(false);
    const [catalogReady, setCatalogReady] = useState(false);
    const [itemStatuses, setItemStatuses] = useState<Record<string, ItemStatus>>({});
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedbackPayload, setFeedbackPayload] = useState<FeedbackPayload>({
        icdCode: "",
        icdName: "",
        feedbackType: "general",
        targetType: "general",
        targetName: "",
        note: ""
    });
    const [feedbackStatus, setFeedbackStatus] = useState("");

    // Toast state
    const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: "success" | "error" | "info" }>>([]);
    const toastIdRef = useRef(0);

    const addToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
        const id = ++toastIdRef.current;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Debounced search
    const debouncedSearchTerm = useDebounce(searchTerm, 200);

    const costSegments: CostSegment[] = useMemo(
        () => buildCostCompositionSegments(state.costComposition),
        [state.costComposition]
    );

    const filteredOptions = useMemo(() => {
        const keyword = debouncedSearchTerm.trim().toLowerCase();
        if (!keyword) return [];

        return diagnosisCatalog
            .filter((item) => item.code.toLowerCase().includes(keyword) || item.label.toLowerCase().includes(keyword))
            .slice(0, 12);
    }, [diagnosisCatalog, debouncedSearchTerm]);

    const toggleDiagnosis = useCallback((code: string) => {
        setSelectedCodes((current) => {
            if (current.includes(code)) {
                return current.filter((item) => item !== code);
            }

            if (current.length >= 5) {
                addToast("Tối đa 5 chẩn đoán cùng lúc.", "error");
                return current;
            }

            return [...current, code];
        });
        setSearchTerm("");
        setItemStatuses({});
    }, [addToast]);

    const removeDiagnosis = useCallback((code: string) => {
        setSelectedCodes((current) => current.filter((item) => item !== code));
        setItemStatuses({});
    }, []);

    const clearAllDiagnoses = useCallback(() => {
        setSelectedCodes([]);
        setState(emptyState);
        setStatus("Sẵn sàng tra ICD.");
        setItemStatuses({});
    }, []);

    const setItemStatus = useCallback((name: string, nextStatus: ItemStatus) => {
        setItemStatuses((current) => ({ ...current, [name]: nextStatus }));
    }, []);

    const openFeedback = useCallback((targetType: FeedbackPayload["targetType"], targetName: string) => {
        const primaryDiag = state.diagnoses[0];
        setFeedbackPayload({
            icdCode: primaryDiag?.code ?? "",
            icdName: primaryDiag?.label ?? "",
            feedbackType: "general",
            targetType,
            targetName,
            note: ""
        });
        setFeedbackOpen(true);
        setFeedbackStatus("");
    }, [state.diagnoses]);

    const closeFeedback = useCallback(() => {
        setFeedbackOpen(false);
    }, []);

    const updateFeedbackPayload = useCallback((patch: Partial<FeedbackPayload>) => {
        setFeedbackPayload((c) => ({ ...c, ...patch }));
    }, []);

    const submitFeedback = useCallback(async () => {
        if (!feedbackPayload.note.trim()) {
            setFeedbackStatus("Vui lòng nhập nội dung phản hồi.");
            return;
        }

        setFeedbackStatus("Đang gửi...");

        try {
            const response = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(feedbackPayload)
            });
            const data = await response.json();

            if (!response.ok || data?.ok === false) {
                throw new Error(data?.message ?? `HTTP ${response.status}`);
            }

            addToast("Đã gửi phản hồi thành công!", "success");
            setTimeout(() => setFeedbackOpen(false), 1000);
        } catch (error) {
            setFeedbackStatus(`Lỗi: ${(error as Error).message}`);
        }
    }, [feedbackPayload, addToast]);

    // Load diagnosis catalog on mount
    useEffect(() => {
        async function loadDiagnosisCatalog() {
            try {
                const response = await fetch("/api/diagnoses/options", { cache: "no-store" });
                const payload = await response.json();

                if (!response.ok || !Array.isArray(payload?.options) || payload.options.length === 0) {
                    throw new Error(payload?.message ?? `HTTP ${response.status}`);
                }

                const nextCatalog = payload.options.map((item: DiagnosisOption) => ({
                    code: String(item.code),
                    label: String(item.label)
                }));

                setDiagnosisCatalog(nextCatalog);
                setCatalogReady(true);
                setStatus("Đã nạp danh sách ICD.");
            } catch (error) {
                setDiagnosisCatalog(defaultDiagnosisOptions);
                setCatalogReady(true);
                setStatus(`Không nạp được ICD trực tuyến. Dùng danh sách sẵn có.`);
            }
        }

        void loadDiagnosisCatalog();
    }, []);

    // Load recommendations when selection changes
    useEffect(() => {
        async function loadRecommendations() {
            if (!catalogReady) return;

            if (selectedCodes.length === 0) {
                setState(emptyState);
                setStatus("Sẵn sàng tra ICD.");
                return;
            }

            setLoading(true);
            setStatus("Đang cập nhật gợi ý...");

            try {
                const response = await fetch("/api/recommendations/preview", {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({
                        action: "recommendations-preview",
                        encounterCode: "OP-IM-0001",
                        diagnoses: selectedCodes.map((code) => {
                            const found = diagnosisCatalog.find((item) => item.code === code);
                            return { icd: code, label: found?.label ?? code };
                        })
                    })
                });

                if (!response.ok) {
                    const errorPayload = await response.json().catch(() => null);
                    throw new Error(errorPayload?.message ?? `HTTP ${response.status}`);
                }

                const payload = await response.json();
                setState(normalizeRecommendationPayload(payload));
                setStatus("Đã cập nhật gợi ý theo ICD đang chọn.");
            } catch (error) {
                setState(buildLocalPreview(selectedCodes, diagnosisCatalog));
                addToast("Đang dùng gợi ý dự phòng (offline).", "info");
                setStatus("Đang dùng gợi ý dự phòng.");
            } finally {
                setLoading(false);
            }
        }

        void loadRecommendations();
    }, [catalogReady, diagnosisCatalog, selectedCodes, addToast]);

    return {
        // State
        diagnosisCatalog,
        selectedCodes,
        searchTerm,
        state,
        status,
        loading,
        itemStatuses,
        feedbackOpen,
        feedbackPayload,
        feedbackStatus,
        costSegments,
        filteredOptions,
        toasts,

        // Actions
        setSearchTerm,
        toggleDiagnosis,
        removeDiagnosis,
        clearAllDiagnoses,
        setItemStatus,
        openFeedback,
        closeFeedback,
        updateFeedbackPayload,
        submitFeedback,
        dismissToast
    };
}

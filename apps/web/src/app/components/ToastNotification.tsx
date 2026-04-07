"use client";

import { memo } from "react";

type Toast = {
    id: number;
    message: string;
    type: "success" | "error" | "info";
};

type Props = {
    toasts: Toast[];
    onDismiss: (id: number) => void;
};

export const ToastContainer = memo(function ToastContainer({ toasts, onDismiss }: Props) {
    if (toasts.length === 0) return null;

    return (
        <div className="toastContainer" aria-live="polite">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
});

const ToastItem = memo(function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
    return (
        <div
            className={`toastItem toastItem-${toast.type}`}
            onClick={() => onDismiss(toast.id)}
            role="alert"
        >
            <span className="toastIcon">
                {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
            </span>
            <span>{toast.message}</span>
        </div>
    );
});

"use client";

import { memo } from "react";
import type { AlertItem, RecommendationState } from "../types";

type Props = {
    alerts: AlertItem[];
    warningMessage?: string;
    recommendedAction?: string;
    reimbursementNote?: string;
};

export const AlertPanel = memo(function AlertPanel({
    alerts,
    warningMessage,
    recommendedAction,
    reimbursementNote
}: Props) {
    const hasContent = warningMessage || recommendedAction || reimbursementNote || alerts.length > 0;

    return (
        <section className="doctorPanel fade-4">
            <div className="doctorPanelHeader">
                <h2>Rủi ro & Cảnh báo BHYT</h2>
                <span>Quy tắc giám định</span>
            </div>
            <div className="alertListSimple">
                {warningMessage ? (
                    <article className="alertSimple alertSimple-medium">
                        <strong>LƯU Ý QUAN TRỌNG</strong>
                        <p>{warningMessage}</p>
                    </article>
                ) : null}
                {recommendedAction ? (
                    <article className="alertSimple alertSimple-low">
                        <strong>HÀNH ĐỘNG KHUYÊN DÙNG</strong>
                        <p>{recommendedAction}</p>
                    </article>
                ) : null}
                {reimbursementNote ? (
                    <article className="alertSimple alertSimple-low">
                        <strong>LƯU Ý THANH TOÁN</strong>
                        <p>{reimbursementNote}</p>
                    </article>
                ) : null}
                {alerts.map((alert) => (
                    <article className={`alertSimple alertSimple-${alert.severity}`} key={alert.title}>
                        <strong>{alert.title}</strong>
                        <p>{alert.description}</p>
                    </article>
                ))}
                {!hasContent ? (
                    <p className="emptyText">Hệ thống chưa phát hiện rủi ro thanh toán cho chẩn đoán này.</p>
                ) : null}
            </div>
        </section>
    );
});

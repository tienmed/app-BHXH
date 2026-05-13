"use client";

import { memo } from "react";
import type { AlertItem, RecommendationState } from "../types";

type Props = {
    alerts: AlertItem[];
    warningMessage?: string;
    recommendedAction?: string;
    reimbursementNote?: string;
    riskScore?: number;
    suggestedJustification?: string;
    aiInsights?: string;
    interactionInsights?: string;
};

export const AlertPanel = memo(function AlertPanel({
    alerts,
    warningMessage,
    recommendedAction,
    reimbursementNote,
    riskScore,
    suggestedJustification,
    aiInsights,
    interactionInsights
}: Props) {
    const hasContent = warningMessage || recommendedAction || reimbursementNote || alerts.length > 0 || riskScore !== undefined;

    const getRiskColor = (score: number) => {
        if (score < 30) return "var(--success-color, #2ecc71)";
        if (score < 60) return "var(--warning-color, #f1c40f)";
        return "var(--danger-color, #e74c3c)";
    };

    return (
        <section className="doctorPanel fade-4">
            <div className="doctorPanelHeader">
                <h2>Rủi ro & Cảnh báo BHYT</h2>
                <span>Quy tắc giám định</span>
            </div>

            {aiInsights && (
                <div className="aiInsightsSection fade-in" style={{ 
                    background: "linear-gradient(135deg, #f0f7ff 0%, #e0e7ff 100%)",
                    border: "1px solid #c7d2fe",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "20px",
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "20px" }}>✨</span>
                        <strong style={{ color: "#4338ca", fontSize: "0.95rem" }}>Đánh giá Y khoa từ AI (Gemma4/Qwen3)</strong>
                        <span className="aiBadge" style={{ 
                            background: "#4338ca", 
                            color: "white", 
                            fontSize: "10px", 
                            padding: "2px 6px", 
                            borderRadius: "10px",
                            marginLeft: "auto",
                            fontWeight: "bold"
                        }}>PREMIUM</span>
                    </div>
                    <div className="aiText" style={{ 
                        color: "#1e1b4b", 
                        fontSize: "0.9rem", 
                        lineHeight: "1.5",
                        whiteSpace: "pre-line"
                    }}>
                        {aiInsights}
                    </div>
                </div>
            )}

            {interactionInsights && interactionInsights !== "Không phát hiện tương tác thuốc đáng ngại" && (
                <div className="interactionSection fade-in" style={{ 
                    background: "#fff1f2",
                    border: "1px solid #fecdd3",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "20px",
                    color: "#9f1239"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "20px" }}>⚠️</span>
                        <strong style={{ fontSize: "0.95rem" }}>Tương tác thuốc Lâm sàng (AI Check)</strong>
                    </div>
                    <div style={{ fontSize: "0.9rem", lineHeight: "1.5" }}>
                        {interactionInsights}
                    </div>
                </div>
            )}

            {riskScore !== undefined && (
                <div className="riskScoreSection">
                    <div className="riskScoreHeader">
                        <strong>Chỉ số rủi ro hồ sơ</strong>
                        <span style={{ color: getRiskColor(riskScore) }}>{riskScore}%</span>
                    </div>
                    <div className="riskProgressBar">
                        <div
                            className="riskProgressInner"
                            style={{
                                width: `${riskScore}%`,
                                backgroundColor: getRiskColor(riskScore)
                            }}
                        />
                    </div>
                    <p className="riskHint">
                        {riskScore > 60 ? "Rủi ro xuất toán cao. Vui lòng kiểm tra lại các chỉ định." :
                            riskScore > 30 ? "Rủi ro trung bình. Cần bổ sung lý do lâm sàng." :
                                "Hồ sơ an toàn."}
                    </p>
                </div>
            )}

            {suggestedJustification && (
                <div className="justificationBox">
                    <strong>Gợi ý nội dung giải trình:</strong>
                    <div className="justificationText">
                        {suggestedJustification}
                        <button
                            className="copyBtn"
                            onClick={() => navigator.clipboard.writeText(suggestedJustification)}
                            title="Sao chép"
                        >📋</button>
                    </div>
                </div>
            )}

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

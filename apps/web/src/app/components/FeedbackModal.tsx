"use client";

import { memo } from "react";
import type { FeedbackPayload } from "../types";

type Props = {
    open: boolean;
    payload: FeedbackPayload;
    status: string;
    onClose: () => void;
    onUpdatePayload: (patch: Partial<FeedbackPayload>) => void;
    onSubmit: () => void;
};

export const FeedbackModal = memo(function FeedbackModal({
    open,
    payload,
    status,
    onClose,
    onUpdatePayload,
    onSubmit
}: Props) {
    if (!open) return null;

    return (
        <div className="feedbackOverlay" onClick={onClose}>
            <div className="feedbackPanel" onClick={(e) => e.stopPropagation()}>
                <h3>Gửi phản hồi cho Admin</h3>
                <p className="feedbackContext">
                    ICD: <strong>{payload.icdCode}</strong> — {payload.targetType !== "general" ? `${payload.targetType}: ${payload.targetName}` : "Phản hồi chung"}
                </p>
                <label>
                    Loại phản hồi
                    <select
                        value={payload.feedbackType}
                        onChange={(e) => onUpdatePayload({ feedbackType: e.target.value as FeedbackPayload["feedbackType"] })}
                    >
                        <option value="not_appropriate">Không phù hợp</option>
                        <option value="missing">Thiếu gợi ý</option>
                        <option value="need_adjustment">Cần điều chỉnh</option>
                        <option value="general">Ý kiến chung</option>
                    </select>
                </label>
                <label>
                    Nội dung phản hồi
                    <textarea
                        rows={3}
                        value={payload.note}
                        onChange={(e) => onUpdatePayload({ note: e.target.value })}
                        placeholder="Mô tả vấn đề hoặc gợi ý cải thiện..."
                    />
                </label>
                <div className="feedbackActions">
                    <button onClick={onClose} type="button">Hủy</button>
                    <button className="feedbackSubmit" onClick={onSubmit} type="button">Gửi phản hồi</button>
                </div>
                {status ? <p className="feedbackStatusText">{status}</p> : null}
            </div>
        </div>
    );
});

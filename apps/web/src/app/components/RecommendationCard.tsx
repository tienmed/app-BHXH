"use client";

import { memo } from "react";
import type { SuggestedItem, ItemStatus, FeedbackPayload } from "../types";
import { shouldShowMappingNote, shouldShowSupplementalText, shouldShowDistinctRationale } from "../utils/recommendation-helpers";

type Props = {
    item: SuggestedItem;
    prefix: string;
    groupNote?: string;
    itemStatus: ItemStatus;
    onSetStatus: (name: string, status: ItemStatus) => void;
    onOpenFeedback: (targetType: FeedbackPayload["targetType"], targetName: string) => void;
    feedbackTargetType: FeedbackPayload["targetType"];
};

export const RecommendationCard = memo(function RecommendationCard({
    item,
    prefix,
    groupNote,
    itemStatus,
    onSetStatus,
    onOpenFeedback,
    feedbackTargetType
}: Props) {
    const itemKey = `${prefix}-${item.name}`;

    return (
        <article className={`doctorListItem doctorListItem-${itemStatus}`}>
            <div className="itemHeader">
                <strong>{item.name}</strong>
                <div className="itemActions">
                    <button
                        className={itemStatus === "accepted" ? "actionBtn actionBtn-active" : "actionBtn"}
                        onClick={() => onSetStatus(itemKey, itemStatus === "accepted" ? "pending" : "accepted")}
                        title="Đồng ý"
                        type="button"
                        aria-label={`Đồng ý ${item.name}`}
                    >✓</button>
                    <button
                        className={itemStatus === "dismissed" ? "actionBtn actionBtn-dismissed" : "actionBtn"}
                        onClick={() => onSetStatus(itemKey, itemStatus === "dismissed" ? "pending" : "dismissed")}
                        title="Bỏ qua"
                        type="button"
                        aria-label={`Bỏ qua ${item.name}`}
                    >✕</button>
                    <button
                        className="actionBtn actionBtn-feedback"
                        onClick={() => onOpenFeedback(feedbackTargetType, item.name)}
                        title="Gửi phản hồi"
                        type="button"
                        aria-label={`Phản hồi ${item.name}`}
                    >💬</button>
                </div>
            </div>
            {shouldShowMappingNote(item.mappingNote, groupNote) ? (
                <div className="itemMetaLabel">Ghi chú ICD: {item.mappingNote}</div>
            ) : null}
            {shouldShowSupplementalText(item.detail, groupNote, item.mappingNote || item.rationale) ? (
                <div className="itemMetaLabel">Thông tin thêm: {item.detail}</div>
            ) : null}
            {shouldShowDistinctRationale(
                item.rationale,
                groupNote,
                item.mappingNote || item.detail
            ) ? (
                <p>{item.rationale}</p>
            ) : null}
        </article>
    );
});

"use client";

import { memo } from "react";
import type { SuggestedItem, ItemStatus, FeedbackPayload } from "../types";
import { RecommendationCard } from "./RecommendationCard";

type Props = {
    title: string;
    items: SuggestedItem[];
    groupNote?: string;
    prefix: string;
    loading: boolean;
    itemStatuses: Record<string, ItemStatus>;
    onSetStatus: (name: string, status: ItemStatus) => void;
    onOpenFeedback: (targetType: FeedbackPayload["targetType"], targetName: string) => void;
    feedbackTargetType: FeedbackPayload["targetType"];
    emptyText: string;
};

export const RecommendationPanel = memo(function RecommendationPanel({
    title,
    items,
    groupNote,
    prefix,
    loading,
    itemStatuses,
    onSetStatus,
    onOpenFeedback,
    feedbackTargetType,
    emptyText
}: Props) {
    return (
        <section className="doctorPanel fade-3">
            <div className="doctorPanelHeader">
                <h2>{title}</h2>
                <span>{items.length} mục</span>
            </div>
            <div className="doctorList">
                {groupNote ? <div className="groupNote">{groupNote}</div> : null}

                {loading ? (
                    <div className="skeletonGroup">
                        <div className="skeleton skeleton-card" />
                        <div className="skeleton skeleton-card" />
                        <div className="skeleton skeleton-card skeleton-short" />
                    </div>
                ) : items.length > 0 ? (
                    items.map((item, index) => {
                        const itemKey = `${prefix}-${item.name}`;
                        return (
                            <RecommendationCard
                                key={`${item.name}-${index}`}
                                item={item}
                                prefix={prefix}
                                groupNote={groupNote}
                                itemStatus={itemStatuses[itemKey] ?? "pending"}
                                onSetStatus={onSetStatus}
                                onOpenFeedback={onOpenFeedback}
                                feedbackTargetType={feedbackTargetType}
                            />
                        );
                    })
                ) : (
                    <p className="emptyText">{emptyText}</p>
                )}
            </div>
        </section>
    );
});

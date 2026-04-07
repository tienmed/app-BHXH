"use client";

import { memo } from "react";
import type { CostSegment } from "../types";

type Props = {
    segments: CostSegment[];
};

export const CostChart = memo(function CostChart({ segments }: Props) {
    if (segments.length === 0) return null;

    return (
        <div className="topCostPanel">
            <div className="topCostHeader">
                <strong>PHÂN TÍCH CƠ CẤU CHI PHÍ</strong>
                <span>Tương quan định mức giữa ICD, CLS và Thuốc theo quy tắc BHYT</span>
            </div>
            <div className="stackedCostTrack" aria-label="Cơ cấu chi phí tham chiếu">
                {segments.map((segment) => (
                    <div
                        className={`stackedCostFill stackedCostFill-${segment.key}`}
                        key={segment.key}
                        style={{ width: segment.width }}
                        title={`${segment.label}: ${segment.raw}%`}
                    />
                ))}
            </div>
            <div className="stackedCostLegend">
                {segments.map((segment) => (
                    <div className="stackedCostLegendItem" key={`legend-${segment.key}`}>
                        <span className={`stackedCostDot stackedCostDot-${segment.key}`} />
                        <strong>{segment.label}</strong>
                        <small>{segment.raw}%</small>
                    </div>
                ))}
            </div>
        </div>
    );
});

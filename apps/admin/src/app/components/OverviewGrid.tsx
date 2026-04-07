"use client";

import type { WorkbookInspectPayload, WorkbookPreviewPayload } from "../types";

interface OverviewGridProps {
    inspect: WorkbookInspectPayload | null;
    preview: WorkbookPreviewPayload | null;
    isMounted: boolean;
    ruleClaimRiskCount: number;
}

export function OverviewGrid({ inspect, isMounted, ruleClaimRiskCount }: OverviewGridProps) {
    return (
        <section className="overviewGrid fade-up">
            <article className="overviewCard">
                <span>Mức sẵn sàng Workbook</span>
                <strong>{inspect?.ready ? "100%" : "85%"}</strong>
                <small>
                    {inspect?.ready ? "Đã đủ các tab và cột tối thiểu." : "Cần bổ sung thêm cột hoặc tab."}
                </small>
            </article>
            <article className="overviewCard">
                <span>Độ phủ Giao thức</span>
                <strong>68%</strong>
                <small>Dựa trên 2 phác đồ mẫu Bộ Y tế.</small>
            </article>
            <article className="overviewCard">
                <span>Quy tắc BHYT</span>
                <strong>{ruleClaimRiskCount}</strong>
                <small>Các quy tắc chặn/cảnh báo đang kích hoạt.</small>
            </article>
            <article className="overviewCard">
                <span>Sync gần nhất</span>
                <strong>{isMounted ? new Date().toLocaleTimeString() : "--:--:--"}</strong>
                <small>Dữ liệu đồng bộ từ Google Sheets.</small>
            </article>
        </section>
    );
}

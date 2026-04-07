"use client";

import { memo } from "react";

type Props = {
    title?: string;
    description?: string;
};

export const EmptyState = memo(function EmptyState({
    title = "Chưa chọn chẩn đoán",
    description = "Nhập mã ICD-10 hoặc từ khóa lâm sàng để bắt đầu tra cứu gợi ý."
}: Props) {
    return (
        <div className="emptyState">
            <svg className="emptyStateIcon" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                {/* Clipboard body */}
                <rect x="25" y="18" width="70" height="90" rx="10" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2.5" />
                {/* Clipboard clip */}
                <rect x="42" y="10" width="36" height="16" rx="6" fill="var(--accent)" opacity="0.25" />
                <rect x="48" y="6" width="24" height="12" rx="5" fill="var(--accent)" />
                {/* Lines */}
                <rect x="40" y="42" width="40" height="5" rx="2.5" fill="var(--accent)" opacity="0.2" />
                <rect x="40" y="56" width="32" height="5" rx="2.5" fill="var(--accent)" opacity="0.15" />
                <rect x="40" y="70" width="36" height="5" rx="2.5" fill="var(--accent)" opacity="0.12" />
                {/* Magnifying glass */}
                <circle cx="85" cy="88" r="14" fill="none" stroke="var(--accent)" strokeWidth="3" opacity="0.5" />
                <line x1="95" y1="98" x2="106" y2="109" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
                {/* Sparkle */}
                <circle cx="30" cy="30" r="3" fill="var(--accent)" opacity="0.3" />
                <circle cx="100" cy="25" r="2" fill="var(--accent)" opacity="0.2" />
            </svg>
            <h3 className="emptyStateTitle">{title}</h3>
            <p className="emptyStateDesc">{description}</p>
        </div>
    );
});

"use client";

import type { LoadingState } from "../types";

interface HeroHeaderProps {
    copyStatus: string;
    loading: LoadingState;
    onRefreshAll: () => void;
    onLoadPreview: () => void;
    onLoadTemplate: () => void;
    onInspectWorkbook: () => void;
    onLoadChangeLog: () => void;
}

export function HeroHeader({
    copyStatus,
    loading,
    onRefreshAll,
    onLoadPreview,
    onLoadTemplate,
    onInspectWorkbook,
    onLoadChangeLog,
}: HeroHeaderProps) {
    return (
        <>
            <header className="hero">
                <div className="heroContent">
                    <span className="eyebrow">WORKSPACE</span>
                    <h2>Điều hành Pilot &amp; Quy tắc BHYT</h2>
                </div>
                <div className="heroActions">
                    <button className="adminButton small" onClick={onRefreshAll}>
                        Sync Sheets
                    </button>
                    <button className="adminButton small secondary" onClick={onLoadPreview}>
                        Data Audit
                    </button>
                </div>
            </header>

            <section className="surface commandBar">
                <div className="adminActions">
                    <button className="iconButton" title="Test Apps Script" onClick={onLoadTemplate}>
                        <span>Test GAS</span>
                    </button>
                    <button className="iconButton" title="Kiểm tra workbook" onClick={onInspectWorkbook}>
                        <span>Inspect Workbook</span>
                    </button>
                    <button className="iconButton" title="Tải lịch sử thay đổi" onClick={onLoadChangeLog}>
                        <span>Changelog</span>
                    </button>
                </div>
                {copyStatus ? <p className="copyStatus">{copyStatus}</p> : null}
            </section>
        </>
    );
}

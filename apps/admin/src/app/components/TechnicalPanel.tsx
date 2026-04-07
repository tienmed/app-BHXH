"use client";

import type { TemplatePayload, WorkbookInspectPayload, WorkbookPreviewPayload, ChangeLogPayload, PreviewRow, LoadingState } from "../types";
import { previewTabs, tabGroups, tabLabels } from "../data/constants";
import { formatCellValue, highlightText, getPrimaryCode, getPrimaryKeyField } from "../utils/admin-helpers";

interface TechnicalPanelProps {
    technicalOpen: boolean;
    template: TemplatePayload | null;
    inspect: WorkbookInspectPayload | null;
    preview: WorkbookPreviewPayload | null;
    changeLog: ChangeLogPayload | null;
    selectedPreviewTab: string;
    searchTerm: string;
    normalizedSearchTerm: string;
    logTabFilter: string;
    logKeyword: string;
    normalizedLogKeyword: string;
    loading: LoadingState;
    selectedRecord: { tabName: string; row: PreviewRow } | null;
    editDraft: Record<string, string>;
    saveNote: string;
    filteredPreviewTabs: Array<{
        name: string;
        headers: string[];
        rowCount: number;
        rows: PreviewRow[];
        filteredRows: PreviewRow[];
    }>;
    filteredChangeLogRows: Array<Record<string, string | number | boolean | null>>;
    onToggle: () => void;
    onSelectedPreviewTabChange: (value: string) => void;
    onSearchTermChange: (value: string) => void;
    onLogTabFilterChange: (value: string) => void;
    onLogKeywordChange: (value: string) => void;
    onExportCsv: () => void;
    onCopyCode: (value: string) => void;
    onOpenRecord: (tabName: string, row: PreviewRow) => void;
    onEditDraftChange: (patch: Record<string, string>) => void;
    onSaveNoteChange: (value: string) => void;
    onSaveRecord: () => void;
    onResetDraft: () => void;
}

export function TechnicalPanel({
    technicalOpen,
    template,
    inspect,
    preview,
    changeLog,
    selectedPreviewTab,
    searchTerm,
    normalizedSearchTerm,
    logTabFilter,
    logKeyword,
    normalizedLogKeyword,
    loading,
    selectedRecord,
    editDraft,
    saveNote,
    filteredPreviewTabs,
    filteredChangeLogRows,
    onToggle,
    onSelectedPreviewTabChange,
    onSearchTermChange,
    onLogTabFilterChange,
    onLogKeywordChange,
    onExportCsv,
    onCopyCode,
    onOpenRecord,
    onEditDraftChange,
    onSaveNoteChange,
    onSaveRecord,
    onResetDraft,
}: TechnicalPanelProps) {
    return (
        <>
            <section className="surface fade-4">
                <div className="surfaceHeader">
                    <h3>Công cụ kỹ thuật khi cần</h3>
                    <button className="toggleTechnicalButton" onClick={onToggle} type="button">
                        {technicalOpen ? "Ẩn công cụ kỹ thuật" : "Mở công cụ kỹ thuật"}
                    </button>
                </div>
                <p className="selectorSummary">
                    Ẩn mặc định để màn quản trị tập trung vào nhập liệu ICD. Chỉ mở khi cần kiểm tra Apps Script,
                    workbook hoặc dữ liệu gốc.
                </p>
            </section>

            {/* Template viewer */}
            {technicalOpen && template ? (
                <section className="surface fade-3">
                    <div className="surfaceHeader">
                        <h3>Mẫu tab đang lấy từ Apps Script</h3>
                        <span>{template.tabs.length} tab kỳ vọng</span>
                    </div>
                    <div className="templateGrid">
                        {template.tabs.map((tab) => (
                            <div className="templateCard" key={tab}>
                                <strong>{tab}</strong>
                                <span>Đã khai báo trong template</span>
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* Workbook inspector */}
            {technicalOpen && inspect ? (
                <section className="surface fade-3">
                    <div className="surfaceHeader">
                        <h3>Dữ liệu đang lấy trực tiếp từ Google Sheet</h3>
                        <span>{inspect.ready ? "Sẵn sàng" : "Cần bổ sung"}</span>
                    </div>
                    <div className="rows">
                        {inspect.tabs.map((tab) => (
                            <article className="row sheetRow" key={tab.name}>
                                <div>
                                    <strong>{tab.name}</strong>
                                    <p>
                                        {tab.exists
                                            ? `${tab.rowCount} dòng dữ liệu, ${tab.columnCount} cột`
                                            : "Chưa có tab trong workbook"}
                                    </p>
                                    <small>
                                        {tab.headers.length > 0
                                            ? `Header: ${tab.headers.join(", ")}`
                                            : "Chưa đọc được header"}
                                    </small>
                                </div>
                                <div className="meta">
                                    <span>{tab.exists ? "Có tab" : "Thiếu tab"}</span>
                                    <strong>
                                        {tab.missingColumns.length === 0
                                            ? "Đủ cột"
                                            : `Thiếu ${tab.missingColumns.length} cột`}
                                    </strong>
                                    {tab.missingColumns.length > 0 ? (
                                        <small>{tab.missingColumns.join(", ")}</small>
                                    ) : null}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* Data preview table */}
            {technicalOpen && preview ? (
                <section className="surface fade-4">
                    <div className="surfaceHeader">
                        <h3>Xem nhanh dữ liệu thật từ Google Sheet</h3>
                        <span>{preview.tabs.length} tab đang hiển thị</span>
                    </div>

                    <div className="previewControls">
                        <label className="controlField">
                            <span>Chọn tab</span>
                            <select
                                value={selectedPreviewTab}
                                onChange={(event) => onSelectedPreviewTabChange(event.target.value)}
                            >
                                <option value="all">Tất cả tab</option>
                                {tabGroups.map((group) => (
                                    <optgroup key={group.label} label={group.label}>
                                        {group.tabs
                                            .filter((tabName) => preview.tabs.some((tab) => tab.name === tabName))
                                            .map((tabName) => (
                                                <option key={tabName} value={tabName}>
                                                    {tabLabels[tabName] ?? tabName}
                                                </option>
                                            ))}
                                    </optgroup>
                                ))}
                            </select>
                        </label>
                        <label className="controlField controlFieldSearch">
                            <span>Tìm nhanh theo mã hoặc tên</span>
                            <input
                                placeholder="Ví dụ: I10, metformin, creatinine..."
                                type="search"
                                value={searchTerm}
                                onChange={(event) => onSearchTermChange(event.target.value)}
                            />
                        </label>
                    </div>

                    <div className="previewToolbar">
                        <div className="previewSummary">
                            <strong>{filteredPreviewTabs.length}</strong>
                            <span>
                                tab phù hợp{normalizedSearchTerm ? ` với từ khóa "${searchTerm}"` : ""}.
                            </span>
                        </div>
                        <button className="adminButton secondary" onClick={onExportCsv} type="button">
                            Xuất CSV theo bộ lọc
                        </button>
                    </div>

                    <div className="previewLayout">
                        <div className="previewStack">
                            {filteredPreviewTabs.map((tab) => (
                                <article className="previewCard" key={tab.name}>
                                    <div className="previewHeader">
                                        <div>
                                            <strong>{tabLabels[tab.name] ?? tab.name}</strong>
                                            <p>
                                                Hiển thị {tab.filteredRows.length} dòng đang khớp, tổng cộng{" "}
                                                {tab.rowCount} dòng dữ liệu trong tab.
                                            </p>
                                        </div>
                                        <span className="previewBadge">{tab.headers.length} cột</span>
                                    </div>

                                    {tab.filteredRows.length > 0 ? (
                                        <div className="previewTableWrap">
                                            <table className="previewTable">
                                                <thead>
                                                    <tr>
                                                        <th>Thao tác</th>
                                                        {tab.headers.map((header) => (
                                                            <th key={header}>{header}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tab.filteredRows.map((row, index) => {
                                                        const primaryCode = getPrimaryCode(row);

                                                        return (
                                                            <tr key={`${tab.name}-${index}`}>
                                                                <td className="actionCell">
                                                                    <div className="actionStack">
                                                                        {primaryCode ? (
                                                                            <button
                                                                                className="copyButton"
                                                                                onClick={() =>
                                                                                    onCopyCode(primaryCode)
                                                                                }
                                                                                type="button"
                                                                            >
                                                                                Copy mã
                                                                            </button>
                                                                        ) : (
                                                                            <span className="copyPlaceholder">
                                                                                —
                                                                            </span>
                                                                        )}
                                                                        <button
                                                                            className="detailButton"
                                                                            onClick={() =>
                                                                                onOpenRecord(tab.name, row)
                                                                            }
                                                                            type="button"
                                                                        >
                                                                            Xem chi tiết
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                {tab.headers.map((header) => {
                                                                    const cellValue = formatCellValue(
                                                                        row[header]
                                                                    );
                                                                    return (
                                                                        <td
                                                                            key={`${tab.name}-${index}-${header}`}
                                                                        >
                                                                            {highlightText(
                                                                                cellValue,
                                                                                normalizedSearchTerm
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="emptyPreview">
                                            {normalizedSearchTerm
                                                ? "Không có dòng nào khớp với từ khóa đang tìm."
                                                : "Tab này đang chưa có dữ liệu mẫu để hiển thị."}
                                        </div>
                                    )}
                                </article>
                            ))}

                            {filteredPreviewTabs.length === 0 ? (
                                <div className="emptyPreview">
                                    Không có tab nào phù hợp với bộ lọc hiện tại.
                                </div>
                            ) : null}
                        </div>

                        {/* Detail panel */}
                        <aside className="detailPanel">
                            <div className="detailPanelHeader">
                                <strong>Chi tiết bản ghi</strong>
                                <span>
                                    {selectedRecord
                                        ? tabLabels[selectedRecord.tabName] ?? selectedRecord.tabName
                                        : "Chưa chọn dòng"}
                                </span>
                            </div>

                            {selectedRecord ? (
                                <div className="detailFields">
                                    {Object.entries(editDraft).map(([key, value]) => {
                                        const isReadOnly =
                                            key === getPrimaryKeyField(selectedRecord.row);
                                        return (
                                            <label className="detailField" key={key}>
                                                <span>{key}</span>
                                                <input
                                                    disabled={isReadOnly || loading === "save"}
                                                    value={value}
                                                    onChange={(event) =>
                                                        onEditDraftChange({
                                                            [key]: event.target.value,
                                                        })
                                                    }
                                                />
                                            </label>
                                        );
                                    })}

                                    <label className="detailField">
                                        <span>Ghi chú thay đổi</span>
                                        <textarea
                                            placeholder="Ví dụ: cập nhật theo phản hồi chuyên môn nội khoa"
                                            value={saveNote}
                                            onChange={(event) => onSaveNoteChange(event.target.value)}
                                        />
                                    </label>

                                    <div className="detailActions">
                                        <button
                                            className="adminButton"
                                            disabled={loading !== null}
                                            onClick={onSaveRecord}
                                            type="button"
                                        >
                                            {loading === "save" ? "Đang lưu..." : "Lưu về Google Sheet"}
                                        </button>
                                        <button
                                            className="adminButton secondary"
                                            disabled={loading === "save"}
                                            onClick={onResetDraft}
                                            type="button"
                                        >
                                            Đặt lại
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="emptyPreview">
                                    Bấm `Xem chi tiết` ở một dòng bất kỳ để xem và chỉnh sửa thông tin.
                                </div>
                            )}
                        </aside>
                    </div>
                </section>
            ) : null}

            {/* Change log viewer */}
            {technicalOpen && changeLog ? (
                <section className="surface fade-4">
                    <div className="surfaceHeader">
                        <h3>Lịch sử thay đổi gần nhất</h3>
                        <span>{changeLog.total} bản ghi log</span>
                    </div>

                    <div className="logControls">
                        <label className="controlField">
                            <span>Lọc theo tab</span>
                            <select
                                value={logTabFilter}
                                onChange={(event) => onLogTabFilterChange(event.target.value)}
                            >
                                <option value="all">Tất cả tab</option>
                                {previewTabs.map((tabName) => (
                                    <option key={tabName} value={tabName}>
                                        {tabLabels[tabName] ?? tabName}
                                    </option>
                                ))}
                                <option value="admin_change_log">admin_change_log</option>
                            </select>
                        </label>
                        <label className="controlField controlFieldSearch">
                            <span>Tìm trong log</span>
                            <input
                                placeholder="Ví dụ: rule_claim_risk, admin-ui, metformin..."
                                type="search"
                                value={logKeyword}
                                onChange={(event) => onLogKeywordChange(event.target.value)}
                            />
                        </label>
                    </div>

                    <div className="previewSummary">
                        <strong>{filteredChangeLogRows.length}</strong>
                        <span>bản ghi log phù hợp với bộ lọc hiện tại.</span>
                    </div>

                    {filteredChangeLogRows.length > 0 ? (
                        <div className="previewTableWrap">
                            <table className="previewTable">
                                <thead>
                                    <tr>
                                        {Object.keys(filteredChangeLogRows[0]).map((header) => (
                                            <th key={header}>{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredChangeLogRows.map((row, index) => (
                                        <tr key={`log-${index}`}>
                                            {Object.keys(filteredChangeLogRows[0]).map((header) => (
                                                <td key={`log-${index}-${header}`}>
                                                    {highlightText(
                                                        formatCellValue(row[header]),
                                                        normalizedLogKeyword
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="emptyPreview">Chưa có thay đổi nào được ghi log.</div>
                    )}
                </section>
            ) : null}
        </>
    );
}

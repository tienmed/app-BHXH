"use client";

import type { ConfiguredIcdRow } from "../types";

interface IcdConfigListProps {
    configuredIcdRows: ConfiguredIcdRow[];
    filteredConfiguredIcdRows: ConfiguredIcdRow[];
    icdSearchTerm: string;
    activeIcdCode: string;
    onIcdSearchChange: (value: string) => void;
    onLoadIcd: (code: string) => void;
}

export function IcdConfigList({
    configuredIcdRows,
    filteredConfiguredIcdRows,
    icdSearchTerm,
    activeIcdCode,
    onIcdSearchChange,
    onLoadIcd,
}: IcdConfigListProps) {
    return (
        <section className="surface fade-3">
            <div className="surfaceHeader">
                <h3>Danh sách ICD đã cấu hình</h3>
                <span>{configuredIcdRows.length} ICD đã setup</span>
            </div>
            <div className="configuredIcdTools">
                <label className="controlField">
                    <span>Tìm theo mã ICD hoặc tên bệnh</span>
                    <input
                        placeholder="Ví dụ: I10, E11.9, tăng huyết áp..."
                        value={icdSearchTerm}
                        onChange={(event) => onIcdSearchChange(event.target.value)}
                    />
                </label>
                <div className="selectorSummary">
                    {icdSearchTerm.trim() === ""
                        ? "Nhập mã ICD hoặc tên bệnh để gọi lại hồ sơ đã có."
                        : filteredConfiguredIcdRows.length > 0
                          ? `Đang hiển thị ${filteredConfiguredIcdRows.length} hồ sơ bệnh đã cấu hình.`
                          : "Chưa có ICD nào khớp với từ khóa tìm kiếm."}
                </div>
            </div>
            {icdSearchTerm.trim() !== "" ? (
                <div className="configuredIcdList">
                    {filteredConfiguredIcdRows.map((row) => (
                        <button
                            className={`configuredIcdItem${activeIcdCode === row.code ? " selected" : ""}`}
                            key={row.code}
                            onClick={() => onLoadIcd(row.code)}
                            type="button"
                        >
                            <strong>{row.name || row.code}</strong>
                            <span>{row.code}</span>
                            <small>{row.chapter || "Chưa phân nhóm chuyên môn"}</small>
                            <div className="configuredIcdStats">
                                <small>{row.clsCount} CLS</small>
                                <small>{row.drugCount} thuốc</small>
                                <small>{row.hasWarning ? "Có cảnh báo" : "Chưa có cảnh báo"}</small>
                            </div>
                            <div className="configuredIcdHealth">
                                <span className={`healthPill${row.clsCount > 0 ? " ready" : ""}`}>CLS</span>
                                <span className={`healthPill${row.drugCount > 0 ? " ready" : ""}`}>Thuốc</span>
                                <span className={`healthPill${row.hasWarning ? " ready" : ""}`}>Cảnh báo</span>
                                <span className={`healthPill${row.hasGroupNotes ? " ready" : ""}`}>Ghi chú nhóm</span>
                            </div>
                            <div className="configuredIcdFooter">
                                <strong>Độ đầy đủ: {row.completeness}/4</strong>
                                <small>
                                    {row.missingItems.length > 0
                                        ? `Còn ${row.missingItems.join(", ")}`
                                        : "Đã có đủ các phần cốt lõi"}
                                </small>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="collapsedHint">Danh sách ICD sẽ hiện khi bạn bắt đầu tìm kiếm.</div>
            )}
        </section>
    );
}

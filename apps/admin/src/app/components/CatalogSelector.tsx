"use client";

import type { PreviewRow, QuickCreateState, MappingDetailItem, LoadingState } from "../types";

interface CatalogSelectorProps {
    kind: "cls" | "drug";
    title: string;
    helpText: string;
    catalogRows: PreviewRow[];
    quickCreate: QuickCreateState;
    selectedCodes: string[];
    selectedLabels: string[];
    selectedDetails: MappingDetailItem[];
    loading: LoadingState;
    lastCreatedEntry: { kind: "cls" | "medication"; code: string; name: string } | null;
    dragState: { kind: "cls" | "drug"; dragIndex: number; overIndex: number } | null;
    groupNoteValue: string;
    groupNotePlaceholder: string;
    groupNoteLabel: string;
    // Quick add form state
    quickAddState: Record<string, string>;
    quickAddFields: Array<{ key: string; label: string; placeholder: string }>;
    // Callbacks
    onToggleCode: (code: string) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onRemoveCode: (code: string) => void;
    onUpdateMappingNote: (code: string, note: string) => void;
    onUpdateRepeatFrequency?: (code: string, freq: string) => void;
    onUpdateGroupNote: (value: string) => void;
    onDragStateChange: (state: { kind: "cls" | "drug"; dragIndex: number; overIndex: number } | null) => void;
    onQuickAddChange: (patch: Record<string, string>) => void;
    onCreateCatalogEntry: () => void;
}

export function CatalogSelector({
    kind,
    title,
    helpText,
    catalogRows,
    quickCreate,
    selectedCodes,
    selectedLabels,
    selectedDetails,
    loading,
    lastCreatedEntry,
    dragState,
    groupNoteValue,
    groupNotePlaceholder,
    groupNoteLabel,
    quickAddState,
    quickAddFields,
    onToggleCode,
    onReorder,
    onRemoveCode,
    onUpdateMappingNote,
    onUpdateRepeatFrequency,
    onUpdateGroupNote,
    onDragStateChange,
    onQuickAddChange,
    onCreateCatalogEntry,
}: CatalogSelectorProps) {
    const codeField = kind === "cls" ? "cls_code" : "drug_code";
    const nameField = kind === "cls" ? "cls_name" : "drug_name";
    const layerOneLabel = kind === "cls" ? "Danh mục nền dùng chung" : "Danh mục thuốc dùng chung";
    const layerOneDesc =
        kind === "cls"
            ? "Một mục chỉ tạo một lần, lưu vào danh mục cận lâm sàng chung của hệ thống."
            : "Một thuốc hoặc nhóm thuốc chỉ tạo một lần, dùng lại cho nhiều ICD.";
    const mappingDetailTitle =
        kind === "cls"
            ? "Thiết lập riêng cho từng xét nghiệm trong ICD này"
            : "Thiết lập riêng cho từng thuốc trong ICD này";
    const mappingDetailDesc =
        kind === "cls"
            ? "Phần này sẽ lưu vào mapping ICD - CLS, không làm thay đổi danh mục nền dùng chung."
            : "Phần này sẽ lưu vào mapping ICD - thuốc, không làm thay đổi danh mục thuốc dùng chung.";
    const emptyDetailMsg =
        kind === "cls"
            ? "Chọn ít nhất 1 xét nghiệm để nhập ghi chú riêng cho ICD này."
            : "Chọn ít nhất 1 thuốc hoặc nhóm thuốc để nhập thông tin riêng cho ICD này.";
    const inlineCreateTitle =
        kind === "cls" ? "Thêm mới vào danh mục cận lâm sàng chung" : "Thêm mới vào danh mục thuốc dùng chung";
    const inlineCreateDesc =
        kind === "cls"
            ? "Mục thêm ở đây sẽ đi vào tab `catalog_cls`, sau đó tự được chọn ngay cho ICD đang mở."
            : "Mục thêm ở đây sẽ đi vào tab `catalog_medication`, sau đó tự được chọn ngay cho ICD đang mở.";
    const createButtonLabel =
        kind === "cls" ? "+ Thêm xét nghiệm mới" : "+ Thêm thuốc / nhóm thuốc mới";
    const lastCreatedKind = kind === "cls" ? "cls" : "medication";

    return (
        <div className="selectorCard">
            <strong>{title}</strong>
            <p className="selectorHelp">{helpText}</p>
            <div className="selectorSummary">
                {selectedCodes.length > 0
                    ? `Đã chọn ${selectedCodes.length} mục: ${selectedLabels.join(", ")}`
                    : kind === "cls"
                      ? "Chưa chọn mục nào. Có thể bỏ trống nếu chưa muốn gợi ý ở bước này."
                      : "Chưa chọn mục nào. Có thể bổ sung sau khi chuẩn hóa phác đồ."}
            </div>
            <div className="mappingGuide">
                <div>
                    <strong>Lớp 1. {layerOneLabel}</strong>
                    <span>{layerOneDesc}</span>
                </div>
                <div>
                    <strong>Lớp 2. Thiết lập riêng cho ICD</strong>
                    <span>
                        {kind === "cls"
                            ? "Sau khi chọn mục, bổ sung ghi chú riêng cho bệnh này ở phần bên dưới."
                            : "Sau khi chọn thuốc, nhập thông tin riêng cho bệnh này ở phần bên dưới."}
                    </span>
                </div>
            </div>

            {/* Chip list */}
            <div className="chipList">
                {catalogRows.map((row) => {
                    const code = String(row[codeField] ?? "");
                    const name = String(row[nameField] ?? "");
                    const selected = selectedCodes.includes(code);

                    return (
                        <button
                            className={`chipButton${selected ? " selected" : ""}`}
                            key={code}
                            onClick={() => onToggleCode(code)}
                            title={selected ? "Nhấp để bỏ chọn" : "Nhấp để chọn"}
                            type="button"
                        >
                            <div className="chipHeader">
                                <span>{name || code}</span>
                                {selected && <span className="checkMark">✓</span>}
                            </div>
                            <small>{code}</small>
                        </button>
                    );
                })}
            </div>

            {/* Priority drag-drop */}
            {selectedCodes.length > 0 && (
                <div className="priorityOrderBox">
                    <div className="priorityOrderHeader">
                        <strong>Thứ tự ưu tiên ({selectedCodes.length} mục)</strong>
                        <span>Kéo thả để thay đổi • Nhấp ✕ để bỏ chọn</span>
                    </div>
                    <div className="priorityList">
                        {selectedCodes.map((code, index) => {
                            const row = catalogRows.find((r) => String(r[codeField] ?? "") === code);
                            const name = row ? String(row[nameField] ?? "") : code;
                            const isDragging = dragState?.kind === kind && dragState.dragIndex === index;
                            const isOver = dragState?.kind === kind && dragState.overIndex === index;

                            return (
                                <div
                                    className={`priorityItem${isDragging ? " dragging" : ""}${isOver ? " dragOver" : ""}`}
                                    draggable
                                    key={code}
                                    onDragEnd={() => {
                                        if (
                                            dragState &&
                                            dragState.kind === kind &&
                                            dragState.overIndex !== dragState.dragIndex
                                        ) {
                                            onReorder(dragState.dragIndex, dragState.overIndex);
                                        }
                                        onDragStateChange(null);
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        onDragStateChange(
                                            dragState ? { ...dragState, overIndex: index } : null
                                        );
                                    }}
                                    onDragStart={() =>
                                        onDragStateChange({ kind, dragIndex: index, overIndex: index })
                                    }
                                >
                                    <span className="dragHandle">⠿</span>
                                    <span className="priorityIndex">{index + 1}</span>
                                    <span className="priorityName">{name}</span>
                                    <small className="priorityCode">{code}</small>
                                    <button
                                        className="priorityRemove"
                                        onClick={() => onRemoveCode(code)}
                                        title="Bỏ chọn"
                                        type="button"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Group note */}
            <label className="controlField">
                <span>{groupNoteLabel}</span>
                <textarea
                    placeholder={groupNotePlaceholder}
                    value={groupNoteValue}
                    onChange={(event) => onUpdateGroupNote(event.target.value)}
                />
            </label>

            {/* Mapping details */}
            <div className="mappingDetailsBox">
                <div className="inlineCreateHeader">
                    <strong>{mappingDetailTitle}</strong>
                    <span>{mappingDetailDesc}</span>
                </div>
                {selectedDetails.length > 0 ? (
                    <div className="mappingDetailsList">
                        {selectedDetails.map((item) => (
                            <label className="mappingDetailCard" key={`${kind}-${item.code}`}>
                                <div className="mappingDetailHeader">
                                    <strong>{item.name}</strong>
                                    <span>{item.group || item.code}</span>
                                </div>
                                {item.catalogHint ? (
                                    <small className="mappingCatalogHint">
                                        Thông tin đang có trong danh mục nền: {item.catalogHint}
                                    </small>
                                ) : null}
                                <textarea
                                    placeholder="Ví dụ: cân nhắc khi nghi nguyên nhân nội tiết, trước điều trị toàn thân, hoặc khi cần theo dõi đặc biệt."
                                    value={item.note}
                                    onChange={(event) => onUpdateMappingNote(item.code, event.target.value)}
                                />
                                {kind === "cls" &&
                                    quickCreate.primaryRuleSet === "repeat-frequency" &&
                                    onUpdateRepeatFrequency && (
                                        <label className="controlField" style={{ marginTop: "8px" }}>
                                            <span>Tần suất cho phép lặp lại (ví dụ: 90 ngày, 3 tháng)</span>
                                            <input
                                                placeholder="Nhập khoảng thời gian chặn lặp lại..."
                                                value={quickCreate.clsRepeatFrequencies?.[item.code] || ""}
                                                onChange={(event) =>
                                                    onUpdateRepeatFrequency(item.code, event.target.value)
                                                }
                                            />
                                        </label>
                                    )}
                            </label>
                        ))}
                    </div>
                ) : (
                    <div className="emptyMappingState">{emptyDetailMsg}</div>
                )}
            </div>

            {/* Inline create */}
            <div className="inlineCreateBox">
                <div className="inlineCreateHeader">
                    <strong>{inlineCreateTitle}</strong>
                    <span>{inlineCreateDesc}</span>
                </div>
                <div className="quickCreateGrid">
                    {quickAddFields.map((field) => (
                        <label className="controlField" key={field.key}>
                            <span>{field.label}</span>
                            <input
                                placeholder={field.placeholder}
                                value={quickAddState[field.key] ?? ""}
                                onChange={(event) => onQuickAddChange({ [field.key]: event.target.value })}
                            />
                        </label>
                    ))}
                </div>
                <div className="detailActions compactActions">
                    <button
                        className="adminButton secondary"
                        disabled={loading !== null}
                        onClick={onCreateCatalogEntry}
                        type="button"
                    >
                        {loading === "save" ? "Đang lưu..." : createButtonLabel}
                    </button>
                </div>
                {lastCreatedEntry?.kind === lastCreatedKind ? (
                    <div className="generatedCodeNote">
                        <strong>Đã tạo mục mới:</strong>
                        <span>{lastCreatedEntry.name}</span>
                        <small>
                            Mục này đã vào danh mục {kind === "cls" ? "cận lâm sàng" : "thuốc"} dùng chung. Mã hệ thống:{" "}
                            {lastCreatedEntry.code}
                        </small>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

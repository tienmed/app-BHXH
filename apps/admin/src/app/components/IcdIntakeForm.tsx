"use client";

import type { QuickCreateState, PreviewRow, MappingDetailItem, CostSuggestionItem, LoadingState } from "../types";
import { createEmptyQuickCreate } from "../utils/admin-helpers";
import { IcdBasicInfo } from "./IcdBasicInfo";
import { CatalogSelector } from "./CatalogSelector";
import { ProtocolSection } from "./ProtocolSection";
import { CostCompositionSection } from "./CostCompositionSection";
import { WarningSection } from "./WarningSection";

interface IcdIntakeFormProps {
    quickCreate: QuickCreateState;
    activeIcdCode: string;
    loading: LoadingState;
    clsCatalogRows: PreviewRow[];
    medicationCatalogRows: PreviewRow[];
    selectedClsLabels: string[];
    selectedDrugLabels: string[];
    selectedClsDetails: MappingDetailItem[];
    selectedDrugDetails: MappingDetailItem[];
    activeCostTotal: number;
    costSuggestions: CostSuggestionItem[];
    lastCreatedCatalogEntry: { kind: "cls" | "medication"; code: string; name: string } | null;
    dragState: { kind: "cls" | "drug"; dragIndex: number; overIndex: number } | null;
    quickAddCls: { name: string; group: string; unit: string; defaultFrequency: string; note: string };
    quickAddMedication: { name: string; group: string; route: string; strength: string; note: string };
    onSetQuickCreate: (updater: (current: QuickCreateState) => QuickCreateState) => void;
    onSetActiveIcdCode: (code: string) => void;
    onSetDragState: (state: { kind: "cls" | "drug"; dragIndex: number; overIndex: number } | null) => void;
    onSetQuickAddCls: (updater: (current: { name: string; group: string; unit: string; defaultFrequency: string; note: string }) => { name: string; group: string; unit: string; defaultFrequency: string; note: string }) => void;
    onSetQuickAddMedication: (updater: (current: { name: string; group: string; route: string; strength: string; note: string }) => { name: string; group: string; route: string; strength: string; note: string }) => void;
    onCreateQuickBundle: () => void;
    onCreateCatalogEntry: (kind: "cls" | "medication") => void;
    onApplyCostSuggestion: (suggestion: CostSuggestionItem) => void;
}

export function IcdIntakeForm({
    quickCreate,
    activeIcdCode,
    loading,
    clsCatalogRows,
    medicationCatalogRows,
    selectedClsLabels,
    selectedDrugLabels,
    selectedClsDetails,
    selectedDrugDetails,
    activeCostTotal,
    costSuggestions,
    lastCreatedCatalogEntry,
    dragState,
    quickAddCls,
    quickAddMedication,
    onSetQuickCreate,
    onSetActiveIcdCode,
    onSetDragState,
    onSetQuickAddCls,
    onSetQuickAddMedication,
    onCreateQuickBundle,
    onCreateCatalogEntry,
    onApplyCostSuggestion,
}: IcdIntakeFormProps) {
    function updateQuickCreate(patch: Partial<QuickCreateState>) {
        onSetQuickCreate((current) => ({ ...current, ...patch }));
    }

    return (
        <section className="surface fade-3">
            <div className="surfaceHeader">
                <h3>Phiếu cấu hình bệnh mới</h3>
                <span>
                    {activeIcdCode
                        ? `Đang mở hồ sơ ${activeIcdCode} để chỉnh sửa / bổ sung`
                        : "Nhập theo chuyên môn, hệ thống tự sắp xếp dữ liệu nền"}
                </span>
            </div>

            <div className="intakeIntro">
                <strong>Admin chỉ cần làm việc theo 2 lớp thông tin chuyên môn.</strong>
                <p>
                    1. Danh mục nền dùng chung: xét nghiệm hoặc thuốc nào đã tồn tại để nhiều ICD cùng dùng. 2. Thiết
                    lập riêng cho ICD đang mở: với bệnh này, mục nào cần gắn vào và ghi chú gì riêng cho từng mục.
                </p>
            </div>

            <IcdBasicInfo
                quickCreate={quickCreate}
                activeIcdCode={activeIcdCode}
                onUpdate={updateQuickCreate}
                onActiveIcdCodeChange={onSetActiveIcdCode}
            />

            <div className="quickCreateSelectors">
                <CatalogSelector
                    kind="cls"
                    title="Xét nghiệm / thăm dò thường cân nhắc"
                    helpText="Chọn từ danh mục nền dùng chung. Nếu danh mục chưa có mục phù hợp, thêm mới vào danh mục trước rồi gắn vào ICD đang mở."
                    catalogRows={clsCatalogRows}
                    quickCreate={quickCreate}
                    selectedCodes={quickCreate.clsCodes}
                    selectedLabels={selectedClsLabels}
                    selectedDetails={selectedClsDetails}
                    loading={loading}
                    lastCreatedEntry={lastCreatedCatalogEntry}
                    dragState={dragState}
                    groupNoteValue={quickCreate.labPurposeNote}
                    groupNotePlaceholder="Ví dụ: Ưu tiên xét nghiệm cơ bản trước, chỉ thêm CLS hình ảnh khi có triệu chứng hô hấp kéo dài hoặc nghi biến chứng."
                    groupNoteLabel="Ghi chú chuyên môn cho nhóm CLS"
                    quickAddState={{
                        name: quickAddCls.name,
                        group: quickAddCls.group,
                        defaultFrequency: quickAddCls.defaultFrequency,
                    }}
                    quickAddFields={[
                        { key: "name", label: "Tên hiển thị", placeholder: "Ví dụ: X-quang phổi thẳng" },
                        { key: "group", label: "Nhóm chuyên môn", placeholder: "Ví dụ: Chẩn đoán hình ảnh" },
                        {
                            key: "defaultFrequency",
                            label: "Thông tin nền của mục này",
                            placeholder: "Ví dụ: lần khám đầu, theo dõi mỗi đợt điều trị",
                        },
                    ]}
                    onToggleCode={(code) =>
                        onSetQuickCreate((current) => {
                            const selected = current.clsCodes.includes(code);
                            return {
                                ...current,
                                clsCodes: selected
                                    ? current.clsCodes.filter((c) => c !== code)
                                    : [...current.clsCodes, code],
                                clsMappingNotes: selected
                                    ? Object.fromEntries(
                                          Object.entries(current.clsMappingNotes).filter(([k]) => k !== code)
                                      )
                                    : current.clsMappingNotes,
                                clsRepeatFrequencies: selected
                                    ? Object.fromEntries(
                                          Object.entries(current.clsRepeatFrequencies).filter(([k]) => k !== code)
                                      )
                                    : current.clsRepeatFrequencies,
                            };
                        })
                    }
                    onReorder={(fromIndex, toIndex) =>
                        onSetQuickCreate((current) => {
                            const next = [...current.clsCodes];
                            const [moved] = next.splice(fromIndex, 1);
                            next.splice(toIndex, 0, moved);
                            return { ...current, clsCodes: next };
                        })
                    }
                    onRemoveCode={(code) =>
                        onSetQuickCreate((current) => ({
                            ...current,
                            clsCodes: current.clsCodes.filter((c) => c !== code),
                            clsMappingNotes: Object.fromEntries(
                                Object.entries(current.clsMappingNotes).filter(([k]) => k !== code)
                            ),
                            clsRepeatFrequencies: Object.fromEntries(
                                Object.entries(current.clsRepeatFrequencies).filter(([k]) => k !== code)
                            ),
                        }))
                    }
                    onUpdateMappingNote={(code, note) =>
                        onSetQuickCreate((current) => ({
                            ...current,
                            clsMappingNotes: { ...current.clsMappingNotes, [code]: note },
                        }))
                    }
                    onUpdateRepeatFrequency={(code, freq) =>
                        onSetQuickCreate((current) => ({
                            ...current,
                            clsRepeatFrequencies: { ...current.clsRepeatFrequencies, [code]: freq },
                        }))
                    }
                    onUpdateGroupNote={(value) => updateQuickCreate({ labPurposeNote: value })}
                    onDragStateChange={onSetDragState}
                    onQuickAddChange={(patch) => onSetQuickAddCls((current) => ({ ...current, ...patch }))}
                    onCreateCatalogEntry={() => onCreateCatalogEntry("cls")}
                />

                <CatalogSelector
                    kind="drug"
                    title="Thuốc / nhóm thuốc thường cân nhắc"
                    helpText="Chọn từ danh mục thuốc dùng chung. Nếu danh mục chưa có mục phù hợp, thêm mới vào danh mục trước rồi gắn vào ICD đang mở."
                    catalogRows={medicationCatalogRows}
                    quickCreate={quickCreate}
                    selectedCodes={quickCreate.drugCodes}
                    selectedLabels={selectedDrugLabels}
                    selectedDetails={selectedDrugDetails}
                    loading={loading}
                    lastCreatedEntry={lastCreatedCatalogEntry}
                    dragState={dragState}
                    groupNoteValue={quickCreate.medicationRoleNote}
                    groupNotePlaceholder="Ví dụ: Ưu tiên điều trị triệu chứng trước, chỉ cân nhắc kháng sinh khi có bằng chứng gợi ý nhiễm khuẩn."
                    groupNoteLabel="Ghi chú chuyên môn cho nhóm thuốc"
                    quickAddState={{
                        name: quickAddMedication.name,
                        group: quickAddMedication.group,
                        routeStrength: `${quickAddMedication.route}${quickAddMedication.route && quickAddMedication.strength ? " / " : ""}${quickAddMedication.strength}`,
                    }}
                    quickAddFields={[
                        { key: "name", label: "Tên hiển thị", placeholder: "Ví dụ: Azithromycin 500 mg" },
                        { key: "group", label: "Nhóm thuốc", placeholder: "Ví dụ: Kháng sinh" },
                        {
                            key: "routeStrength",
                            label: "Thông tin nền của mục này",
                            placeholder: "Ví dụ: Uống / 500 mg",
                        },
                    ]}
                    onToggleCode={(code) =>
                        onSetQuickCreate((current) => {
                            const selected = current.drugCodes.includes(code);
                            return {
                                ...current,
                                drugCodes: selected
                                    ? current.drugCodes.filter((c) => c !== code)
                                    : [...current.drugCodes, code],
                                drugMappingNotes: selected
                                    ? Object.fromEntries(
                                          Object.entries(current.drugMappingNotes).filter(([k]) => k !== code)
                                      )
                                    : current.drugMappingNotes,
                            };
                        })
                    }
                    onReorder={(fromIndex, toIndex) =>
                        onSetQuickCreate((current) => {
                            const next = [...current.drugCodes];
                            const [moved] = next.splice(fromIndex, 1);
                            next.splice(toIndex, 0, moved);
                            return { ...current, drugCodes: next };
                        })
                    }
                    onRemoveCode={(code) =>
                        onSetQuickCreate((current) => ({
                            ...current,
                            drugCodes: current.drugCodes.filter((c) => c !== code),
                            drugMappingNotes: Object.fromEntries(
                                Object.entries(current.drugMappingNotes).filter(([k]) => k !== code)
                            ),
                        }))
                    }
                    onUpdateMappingNote={(code, note) =>
                        onSetQuickCreate((current) => ({
                            ...current,
                            drugMappingNotes: { ...current.drugMappingNotes, [code]: note },
                        }))
                    }
                    onUpdateGroupNote={(value) => updateQuickCreate({ medicationRoleNote: value })}
                    onDragStateChange={onSetDragState}
                    onQuickAddChange={(patch) => {
                        if ("routeStrength" in patch) {
                            const [route, strength] = (patch.routeStrength ?? "").split("/").map((s) => s.trim());
                            onSetQuickAddMedication((current) => ({
                                ...current,
                                route: route ?? "",
                                strength: strength ?? "",
                            }));
                        } else {
                            onSetQuickAddMedication((current) => ({ ...current, ...patch }));
                        }
                    }}
                    onCreateCatalogEntry={() => onCreateCatalogEntry("medication")}
                />
            </div>

            <ProtocolSection quickCreate={quickCreate} onUpdate={updateQuickCreate} />

            <CostCompositionSection
                quickCreate={quickCreate}
                activeCostTotal={activeCostTotal}
                costSuggestions={costSuggestions}
                onUpdate={updateQuickCreate}
                onApplySuggestion={onApplyCostSuggestion}
            />

            <WarningSection quickCreate={quickCreate} onUpdate={updateQuickCreate} />

            <div className="detailActions">
                <button
                    className="adminButton"
                    disabled={loading !== null}
                    onClick={onCreateQuickBundle}
                    type="button"
                >
                    {loading === "save"
                        ? "Đang lưu phiếu..."
                        : activeIcdCode
                          ? "Cập nhật ICD đang chọn"
                          : "Lưu bệnh mới vào hệ thống"}
                </button>
                <button
                    className="adminButton secondary"
                    disabled={loading === "save"}
                    onClick={() => {
                        onSetQuickCreate(() => createEmptyQuickCreate());
                        onSetActiveIcdCode("");
                    }}
                    type="button"
                >
                    Làm trống phiếu
                </button>
            </div>
        </section>
    );
}

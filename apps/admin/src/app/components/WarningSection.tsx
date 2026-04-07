"use client";

import type { QuickCreateState } from "../types";

interface WarningSectionProps {
    quickCreate: QuickCreateState;
    onUpdate: (patch: Partial<QuickCreateState>) => void;
}

export function WarningSection({ quickCreate, onUpdate }: WarningSectionProps) {
    return (
        <>
            <div className="intakeSection">
                <div className="intakeSectionHeader">
                    <strong>7. Cảnh báo chuyên môn</strong>
                    <span>Nêu rõ điều gì dễ chỉ định chưa phù hợp hoặc dễ phát sinh nguy cơ xuất toán.</span>
                </div>
                <div className="quickCreateGrid singleColumn">
                    <label className="controlField">
                        <span>Điều cần lưu ý khi chỉ định</span>
                        <textarea
                            placeholder="Ví dụ: Cần rà soát chỉ định X-quang phổi và kháng sinh nếu chưa có bằng chứng lâm sàng phù hợp."
                            value={quickCreate.warningMessage}
                            onChange={(event) => onUpdate({ warningMessage: event.target.value })}
                        />
                    </label>
                    <label className="controlField">
                        <span>Lưu ý về BHYT / cơ cấu chi phí</span>
                        <textarea
                            placeholder="Ví dụ: Tránh chỉ định đồng thời nhiều CLS nâng cao trong lần khám đầu nếu chưa có dấu hiệu nặng; cơ cấu chi phí nên ưu tiên phần ICD và CLS cơ bản."
                            value={quickCreate.reimbursementNote}
                            onChange={(event) => onUpdate({ reimbursementNote: event.target.value })}
                        />
                    </label>
                </div>
            </div>

            <div className="intakeSection">
                <div className="intakeSectionHeader">
                    <strong>8. Hành động gợi ý cho bác sĩ</strong>
                    <span>Câu này sẽ là phần hệ thống ưu tiên hiển thị khi bác sĩ tải gợi ý.</span>
                </div>
                <div className="quickCreateGrid singleColumn">
                    <label className="controlField">
                        <span>Gợi ý hiển thị cho bác sĩ</span>
                        <textarea
                            placeholder="Ví dụ: Ưu tiên CLS cơ bản trước, chỉ thêm thuốc/CLS nâng cao khi có dấu hiệu nặng."
                            value={quickCreate.recommendedAction}
                            onChange={(event) => onUpdate({ recommendedAction: event.target.value })}
                        />
                    </label>
                    <label className="controlField">
                        <span>Ghi chú chuyên môn nội bộ</span>
                        <textarea
                            placeholder="Ví dụ: Bổ sung theo phác đồ nội khoa tháng 4/2026."
                            value={quickCreate.note}
                            onChange={(event) => onUpdate({ note: event.target.value })}
                        />
                    </label>
                </div>
            </div>

            <div className="quickCreateGrid singleColumn">
                <label className="controlField">
                    <span>Tóm tắt để hệ thống tự ghi kỹ thuật nền</span>
                    <textarea
                        placeholder="Tự do ghi thêm các lưu ý khác; hệ thống sẽ dùng phần này cùng các mục ở trên để tạo dữ liệu nền kỹ thuật."
                        value={quickCreate.systemSupportNote}
                        onChange={(event) => onUpdate({ systemSupportNote: event.target.value })}
                    />
                </label>
            </div>
        </>
    );
}

"use client";

import type { QuickCreateState } from "../types";

interface IcdBasicInfoProps {
    quickCreate: QuickCreateState;
    activeIcdCode: string;
    onUpdate: (patch: Partial<QuickCreateState>) => void;
    onActiveIcdCodeChange: (code: string) => void;
}

export function IcdBasicInfo({ quickCreate, activeIcdCode, onUpdate, onActiveIcdCodeChange }: IcdBasicInfoProps) {
    return (
        <>
            <div className="intakeSection">
                <div className="intakeSectionHeader">
                    <strong>1. Hồ sơ bệnh / chẩn đoán</strong>
                    <span>Chỉ nhập các thông tin chuyên môn cốt lõi của bệnh mới.</span>
                </div>
                <div className="quickCreateGrid">
                    <label className="controlField">
                        <span>Mã bệnh mới</span>
                        <input
                            placeholder="Ví dụ: J20.9"
                            value={quickCreate.icdCode}
                            onChange={(event) => {
                                const nextCode = event.target.value.toUpperCase();
                                onUpdate({ icdCode: nextCode });
                                if (nextCode !== activeIcdCode) {
                                    onActiveIcdCodeChange("");
                                }
                            }}
                        />
                    </label>
                    <label className="controlField">
                        <span>Tên bệnh / chẩn đoán</span>
                        <input
                            placeholder="Ví dụ: Viêm phế quản cấp, không xác định"
                            value={quickCreate.icdName}
                            onChange={(event) => onUpdate({ icdName: event.target.value })}
                        />
                    </label>
                    <label className="controlField">
                        <span>Nhóm chuyên môn</span>
                        <input
                            placeholder="Ví dụ: Nội khoa hô hấp"
                            value={quickCreate.chapter}
                            onChange={(event) => onUpdate({ chapter: event.target.value })}
                        />
                    </label>
                    <label className="controlField">
                        <span>Mức cần lưu ý</span>
                        <select
                            value={quickCreate.severity}
                            onChange={(event) => onUpdate({ severity: event.target.value })}
                        >
                            <option value="low">Thấp</option>
                            <option value="medium">Trung bình</option>
                            <option value="high">Cao</option>
                        </select>
                    </label>
                </div>
                <div className="quickCreateGrid singleColumn">
                    <label className="controlField">
                        <span>Mô tả ngắn về bệnh / phạm vi áp dụng</span>
                        <textarea
                            placeholder="Ví dụ: Dùng cho bệnh nhân viêm phế quản cấp chưa có dấu hiệu suy hô hấp, ưu tiên xử trí ngoại trú."
                            value={quickCreate.description}
                            onChange={(event) => onUpdate({ description: event.target.value })}
                        />
                    </label>
                </div>
            </div>

            <div className="intakeSection">
                <div className="intakeSectionHeader">
                    <strong>2. Điều kiện gợi ý</strong>
                    <span>Giúp hệ thống hiểu bối cảnh áp dụng theo chuyên môn, không chỉ theo mã bệnh.</span>
                </div>
                <div className="quickCreateGrid">
                    <label className="controlField">
                        <span>Nơi áp dụng</span>
                        <input
                            placeholder="Ví dụ: Ngoại trú"
                            value={quickCreate.careSetting}
                            onChange={(event) => onUpdate({ careSetting: event.target.value })}
                        />
                    </label>
                    <label className="controlField">
                        <span>Nhóm tuổi</span>
                        <input
                            placeholder="Ví dụ: Người lớn"
                            value={quickCreate.ageGroup}
                            onChange={(event) => onUpdate({ ageGroup: event.target.value })}
                        />
                    </label>
                    <label className="controlField">
                        <span>Bối cảnh khám</span>
                        <input
                            placeholder="Ví dụ: Khám mới, tái khám ổn định"
                            value={quickCreate.visitContext}
                            onChange={(event) => onUpdate({ visitContext: event.target.value })}
                        />
                    </label>
                    <label className="controlField">
                        <span>Dấu hiệu / triệu chứng cần lưu ý</span>
                        <input
                            placeholder="Ví dụ: Sốt kéo dài, ran phổi, khó thở"
                            value={quickCreate.triggerSymptoms}
                            onChange={(event) => onUpdate({ triggerSymptoms: event.target.value })}
                        />
                    </label>
                </div>
                <div className="quickCreateGrid singleColumn">
                    <label className="controlField">
                        <span>Tình huống cần tránh hoặc chống chỉ định</span>
                        <textarea
                            placeholder="Ví dụ: Không áp dụng gợi ý ngoại trú nếu SpO2 giảm, nghi viêm phổi nặng hoặc có bệnh nền mất bù."
                            value={quickCreate.contraindications}
                            onChange={(event) => onUpdate({ contraindications: event.target.value })}
                        />
                    </label>
                </div>
            </div>
        </>
    );
}

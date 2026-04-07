"use client";

import type { QuickCreateState } from "../types";

interface ProtocolSectionProps {
    quickCreate: QuickCreateState;
    onUpdate: (patch: Partial<QuickCreateState>) => void;
}

export function ProtocolSection({ quickCreate, onUpdate }: ProtocolSectionProps) {
    return (
        <div className="intakeSection">
            <div className="intakeSectionHeader">
                <strong>5. Phác đồ gợi ý theo ICD</strong>
                <span>Phần này sẽ được ghi vào protocol header và protocol item để hệ thống có nguồn phác đồ theo bệnh.</span>
            </div>
            <div className="quickCreateGrid">
                <label className="controlField">
                    <span>Tên phác đồ hiển thị</span>
                    <input
                        placeholder="Ví dụ: Viêm xoang cấp ngoại trú"
                        value={quickCreate.protocolName}
                        onChange={(event) => onUpdate({ protocolName: event.target.value })}
                    />
                </label>
                <label className="controlField">
                    <span>Đơn vị phụ trách phác đồ</span>
                    <input
                        placeholder="Ví dụ: Phòng khám Tai mũi họng"
                        value={quickCreate.protocolOwner}
                        onChange={(event) => onUpdate({ protocolOwner: event.target.value })}
                    />
                </label>
                <label className="controlField">
                    <span>Trạng thái áp dụng</span>
                    <select
                        value={quickCreate.protocolStatus}
                        onChange={(event) => onUpdate({ protocolStatus: event.target.value })}
                    >
                        <option value="active">Đang áp dụng</option>
                        <option value="draft">Nháp</option>
                        <option value="inactive">Tạm ngưng</option>
                    </select>
                </label>
            </div>
            <div className="protocolPreviewNote">
                <strong>Hệ thống sẽ tự tạo danh mục mục tiêu của phác đồ từ phần bạn đã chọn ở trên.</strong>
                <p>
                    Các xét nghiệm và thuốc đã chọn cho ICD này sẽ được ghi thành protocol item, ưu tiên theo thứ tự bạn
                    đang sắp xếp/chọn.
                </p>
            </div>
        </div>
    );
}

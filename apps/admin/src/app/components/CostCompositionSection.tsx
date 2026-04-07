"use client";

import type { QuickCreateState, CostSuggestionItem } from "../types";

interface CostCompositionSectionProps {
    quickCreate: QuickCreateState;
    activeCostTotal: number;
    costSuggestions: CostSuggestionItem[];
    onUpdate: (patch: Partial<QuickCreateState>) => void;
    onApplySuggestion: (suggestion: CostSuggestionItem) => void;
}

export function CostCompositionSection({
    quickCreate,
    activeCostTotal,
    costSuggestions,
    onUpdate,
    onApplySuggestion,
}: CostCompositionSectionProps) {
    return (
        <div className="intakeSection">
            <div className="intakeSectionHeader">
                <strong>6. Khung cơ cấu chi phí mục tiêu</strong>
                <span>Phần này sẽ được ghi vào rule cost composition để hệ thống so chiếu cơ cấu ICD - CLS - thuốc.</span>
            </div>
            <div className="quickCreateGrid">
                <label className="controlField">
                    <span>Tỷ trọng ICD tối đa (%)</span>
                    <input
                        inputMode="numeric"
                        placeholder="Ví dụ: 30"
                        value={quickCreate.icdRatioMax}
                        onChange={(event) => onUpdate({ icdRatioMax: event.target.value })}
                    />
                </label>
                <label className="controlField">
                    <span>Tỷ trọng CLS tối đa (%)</span>
                    <input
                        inputMode="numeric"
                        placeholder="Ví dụ: 40"
                        value={quickCreate.clsRatioMax}
                        onChange={(event) => onUpdate({ clsRatioMax: event.target.value })}
                    />
                </label>
                <label className="controlField">
                    <span>Tỷ trọng thuốc tối đa (%)</span>
                    <input
                        inputMode="numeric"
                        placeholder="Ví dụ: 30"
                        value={quickCreate.drugRatioMax}
                        onChange={(event) => onUpdate({ drugRatioMax: event.target.value })}
                    />
                </label>
            </div>
            <div className="ruleSetOfficialCard">
                <div>
                    <strong>Rule set xuất toán cơ bản</strong>
                    <p>
                        Đây là rule set chính thức cho flow nhập ICD theo trục ICD + CLS + thuốc, dùng để cảnh báo tương
                        quan chi phí trước khi hiển thị cho bác sĩ.
                    </p>
                </div>
                <span className="ruleCoverageBadge">ICD + CLS + thuốc</span>
            </div>
            <div className="costTotalNote">
                <strong>Tổng hiện tại: {activeCostTotal}%</strong>
                <span>
                    {activeCostTotal === 100
                        ? "Đã cân bằng đúng 100%, phù hợp để dùng làm cơ cấu tham chiếu."
                        : "Nên điều chỉnh để tổng 3 thành phần về 100% trước khi lưu."}
                </span>
            </div>
            <div className="costSuggestionHeader">
                <strong>Gợi ý tỷ lệ tương quan với các ICD đã tạo</strong>
                <span>Ưu tiên mẫu theo ICD đang nhập, sau đó là các ICD đang có cấu hình chi phí để đối chiếu nhanh.</span>
            </div>
            <div className="ratioSuggestionGrid">
                {costSuggestions.map((suggestion) => (
                    <article className={`ratioSuggestionCard ${suggestion.tone}`} key={suggestion.key}>
                        <div className="ratioSuggestionTop">
                            <strong>{suggestion.title}</strong>
                            <span>
                                ICD {suggestion.icdRatio}% • CLS {suggestion.clsRatio}% • Thuốc {suggestion.drugRatio}%
                            </span>
                        </div>
                        <p>{suggestion.description}</p>
                        <button
                            className="adminButton secondary"
                            onClick={() => onApplySuggestion(suggestion)}
                            type="button"
                        >
                            Áp dụng gợi ý này
                        </button>
                    </article>
                ))}
            </div>
        </div>
    );
}

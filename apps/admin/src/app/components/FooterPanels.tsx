"use client";

import type { QuickCreateState } from "../types";
import { protocolVersions, ruleSets, metrics } from "../data/constants";

interface FooterPanelsProps {
    quickCreate: QuickCreateState;
    onUpdate: (patch: Partial<QuickCreateState>) => void;
}

export function FooterPanels({ quickCreate, onUpdate }: FooterPanelsProps) {
    return (
        <>
            <section className="surface fade-2">
                <div className="surfaceHeader">
                    <h3>Danh sách phiên bản phác đồ</h3>
                    <span>2 phiên bản minh họa</span>
                </div>
                <div className="rows">
                    {protocolVersions.map((item) => (
                        <article className="row" key={item.version}>
                            <div>
                                <strong>{item.name}</strong>
                                <p>{item.note}</p>
                            </div>
                            <div className="meta">
                                <span>{item.version}</span>
                                <strong>{item.status}</strong>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="dualGrid">
                <div className="surface fade-3">
                    <div className="surfaceHeader">
                        <h3>Ưu tiên rule set</h3>
                        <span>Đưa vào thực tế nhập liệu</span>
                    </div>
                    <div className="quickCreateGrid">
                        <label className="controlField">
                            <span>Rule set chính đang áp dụng cho ICD này</span>
                            <select
                                value={quickCreate.primaryRuleSet}
                                onChange={(event) => onUpdate({ primaryRuleSet: event.target.value })}
                            >
                                {ruleSets.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="controlField">
                            <span>Mức ưu tiên áp dụng</span>
                            <select
                                value={quickCreate.rulePriorityLevel}
                                onChange={(event) => onUpdate({ rulePriorityLevel: event.target.value })}
                            >
                                <option value="high">Ưu tiên cao</option>
                                <option value="medium">Ưu tiên trung bình</option>
                                <option value="low">Ưu tiên thấp</option>
                            </select>
                        </label>
                    </div>
                    <div className="quickCreateGrid singleColumn">
                        <label className="controlField">
                            <span>Trọng tâm của rule set cho ICD này</span>
                            <input
                                placeholder="Ví dụ: Cảnh báo trước xuất toán, ưu tiên nhắc CLS nền, hạn chế kháng sinh sớm..."
                                value={quickCreate.ruleFocus}
                                onChange={(event) => onUpdate({ ruleFocus: event.target.value })}
                            />
                        </label>
                        <label className="controlField checkboxField">
                            <input
                                type="checkbox"
                                checked={quickCreate.ruleIsActive ?? true}
                                onChange={(event) => onUpdate({ ruleIsActive: event.target.checked })}
                            />
                            <div className="checkboxLabel">
                                <strong>Kích hoạt logic hoạt động của rule này trên hệ thống</strong>
                                <span>
                                    Ngay khi lưu, các cảnh báo tương quan và ưu tiên của rule set này sẽ bắt đầu được
                                    thực thi ở màn hình bác sĩ.
                                </span>
                            </div>
                        </label>
                    </div>
                    <div className="rows compact">
                        {ruleSets.map((item) => {
                            const selected = quickCreate.primaryRuleSet === item.id;
                            return (
                                <article
                                    className={`row compactRow${selected ? " selectedCompactRow" : ""}`}
                                    key={item.id}
                                >
                                    <strong>{item.name}</strong>
                                    <p>{item.coverage}</p>
                                    <span>{selected ? "Đang dùng cho ICD đang mở" : item.state}</span>
                                    <small>{item.note}</small>
                                </article>
                            );
                        })}
                    </div>
                </div>

                <div className="surface fade-4">
                    <div className="surfaceHeader">
                        <h3>Ảnh chụp mức sẵn sàng</h3>
                        <span>Minh họa governance</span>
                    </div>
                    <div className="metricGrid">
                        {metrics.map((metric) => (
                            <div className="metric" key={metric.label}>
                                <span>{metric.label}</span>
                                <strong>{metric.value}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

type Diagnosis = {
  code: string;
  label: string;
};

type DiagnosisOption = {
  code: string;
  label: string;
};

type SuggestedItem = {
  name: string;
  rationale: string;
  detail?: string;
  mappingNote?: string;
};

type AlertItem = {
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
};

type RecommendationState = {
  diagnoses: Diagnosis[];
  investigations: SuggestedItem[];
  investigationsNote?: string;
  medications: SuggestedItem[];
  medicationsNote?: string;
  warningMessage?: string;
  recommendedAction?: string;
  reimbursementNote?: string;
  costComposition?: {
    icd: number;
    cls: number;
    medications: number;
  };
  alerts: AlertItem[];
};

type ItemStatus = "pending" | "accepted" | "dismissed";

type FeedbackPayload = {
  icdCode: string;
  icdName: string;
  feedbackType: "not_appropriate" | "missing" | "need_adjustment" | "general";
  targetType: "cls" | "medication" | "alert" | "general";
  targetName: string;
  note: string;
};

const defaultDiagnosisOptions: DiagnosisOption[] = [
  { code: "I10", label: "Tăng huyết áp nguyên phát" },
  { code: "E11.9", label: "Đái tháo đường típ 2 không biến chứng" },
  { code: "E78.5", label: "Rối loạn lipid máu" },
  { code: "L02", label: "Áp xe da, nhọt, hậu bối" },
  { code: "L70", label: "Mụn trứng cá" }
];

const localInvestigations: Record<string, SuggestedItem[]> = {
  I10: [
    { name: "Công thức máu", rationale: "Đánh giá nền trước điều trị và theo dõi ngoại trú." },
    { name: "Creatinine huyết thanh", rationale: "Theo dõi chức năng thận khi điều trị tăng huyết áp." }
  ],
  "E11.9": [
    { name: "Đường huyết", rationale: "Theo dõi mức kiểm soát đường huyết tại thời điểm khám." },
    { name: "HbA1c", rationale: "Đánh giá kiểm soát đường huyết dài hạn." }
  ],
  L02: [
    { name: "Công thức máu", rationale: "Cân nhắc khi có dấu hiệu nhiễm trùng mức độ vừa hoặc nặng." },
    { name: "Đường huyết", rationale: "Cân nhắc khi nghi đái tháo đường hoặc vết thương lâu lành." }
  ],
  L70: [{ name: "Không cần cận lâm sàng thường quy", rationale: "Ưu tiên đánh giá lâm sàng, chỉ mở rộng khi nghi nguyên nhân nội tiết hoặc trước điều trị toàn thân." }]
};

const localMedications: Record<string, SuggestedItem[]> = {
  I10: [
    { name: "Nhóm ƯCMC/ƯCTT", rationale: "Thường là lựa chọn nền nếu phù hợp lâm sàng." },
    { name: "Chẹn kênh canxi", rationale: "Có thể cân nhắc phối hợp khi chưa đạt mục tiêu huyết áp." }
  ],
  "E11.9": [
    { name: "Metformin", rationale: "Là lựa chọn nền thường dùng nếu không có chống chỉ định." }
  ],
  L02: [
    { name: "Kháng sinh phù hợp lâm sàng", rationale: "Chỉ cân nhắc khi có dấu hiệu lan rộng hoặc toàn thân." },
    { name: "Giảm đau / chăm sóc tại chỗ", rationale: "Ưu tiên theo mức độ tổn thương và xử trí ổ mủ." }
  ],
  L70: [
    { name: "Benzoyl peroxide", rationale: "Ưu tiên cho mụn mức độ nhẹ đến trung bình." },
    { name: "Retinoid bôi", rationale: "Cân nhắc khi cần kiểm soát nhân mụn và viêm." }
  ]
};

const localAlerts: Record<string, AlertItem[]> = {
  "E11.9": [
    {
      severity: "high",
      title: "Cân nhắc tần suất lặp HbA1c",
      description: "Không nên lặp quá sớm nếu chưa có lý do lâm sàng rõ."
    }
  ],
  L02: [
    {
      severity: "medium",
      title: "Không mở rộng chỉ định quá mức",
      description: "Áp xe da khu trú thường ưu tiên khám lâm sàng và xử trí tại chỗ trước."
    }
  ],
  L70: [
    {
      severity: "low",
      title: "Hạn chế xét nghiệm không cần thiết",
      description: "Mụn trứng cá thông thường thường không cần cận lâm sàng rộng rãi."
    }
  ]
};

const emptyState: RecommendationState = {
  diagnoses: [],
  investigations: [],
  medications: [],
  alerts: []
};

function buildLocalPreview(selectedCodes: string[], catalog: DiagnosisOption[]): RecommendationState {
  const diagnoses = selectedCodes.map((code) => {
    const found = catalog.find((item) => item.code === code);

    return {
      code,
      label: found?.label ?? code
    };
  });

  const investigationMap = new Map<string, SuggestedItem>();
  const medicationMap = new Map<string, SuggestedItem>();
  const alertMap = new Map<string, AlertItem>();

  selectedCodes.forEach((code) => {
    (localInvestigations[code] ?? []).forEach((item) => investigationMap.set(item.name, item));
    (localMedications[code] ?? []).forEach((item) => medicationMap.set(item.name, item));
    (localAlerts[code] ?? []).forEach((item) => alertMap.set(item.title, item));
  });

  return {
    diagnoses,
    investigations: Array.from(investigationMap.values()),
    medications: Array.from(medicationMap.values()),
    investigationsNote: "",
    medicationsNote: "",
    warningMessage: "",
    recommendedAction: "",
    reimbursementNote: "",
    alerts: Array.from(alertMap.values())
  };
}

function normalizeRecommendationPayload(payload: any): RecommendationState {
  const diagnoses = (payload?.diagnoses ?? []).map((item: any) => ({
    code: String(item.code ?? item.icd ?? ""),
    label: String(item.label ?? item.name ?? item.icd ?? "")
  }));

  const investigations = (payload?.recommendations?.investigations ?? []).map((item: any) => ({
    name: String(item.name ?? ""),
    rationale: String(item.rationale ?? ""),
    detail: String(item.detail ?? ""),
    mappingNote: String(item.mappingNote ?? "")
  }));

  const medications = (payload?.recommendations?.medicationGroups ?? []).map((item: any) => ({
    name: String(item.name ?? ""),
    rationale: String(item.rationale ?? ""),
    detail: String(item.detail ?? ""),
    mappingNote: String(item.mappingNote ?? "")
  }));

  const alerts = (payload?.reimbursementGuard?.alerts ?? []).map((item: any) => ({
    severity: (item.severity ?? "medium") as "high" | "medium" | "low",
    title: String(item.title ?? item.rule_name ?? "Cảnh báo"),
    description: String(item.description ?? item.message ?? item.warning_message ?? "")
  }));

  return {
    diagnoses,
    investigations,
    investigationsNote: String(payload?.recommendations?.investigationsNote ?? ""),
    medications,
    medicationsNote: String(payload?.recommendations?.medicationGroupsNote ?? ""),
    warningMessage: String(payload?.claimRisk?.warningMessage ?? ""),
    recommendedAction: String(payload?.claimRisk?.recommendedAction ?? ""),
    reimbursementNote: String(payload?.claimRisk?.reimbursementNote ?? ""),
    costComposition: payload?.reimbursementGuard?.costComposition
      ? {
        icd: Number(payload.reimbursementGuard.costComposition.icd ?? 0),
        cls: Number(payload.reimbursementGuard.costComposition.cls ?? 0),
        medications: Number(payload.reimbursementGuard.costComposition.medications ?? 0)
      }
      : undefined,
    alerts
  };
}

function shouldShowSupplementalText(value: string | undefined, groupNote: string | undefined, rationale: string | undefined) {
  const normalizedValue = String(value ?? "").trim();
  const normalizedGroup = String(groupNote ?? "").trim();
  const normalizedRationale = String(rationale ?? "").trim();

  if (!normalizedValue) {
    return false;
  }

  if (normalizedValue === normalizedGroup) {
    return false;
  }

  if (normalizedValue === normalizedRationale) {
    return false;
  }

  return true;
}

function shouldShowMappingNote(value: string | undefined, groupNote: string | undefined) {
  const normalizedValue = String(value ?? "").trim();
  const normalizedGroup = String(groupNote ?? "").trim();

  if (!normalizedValue) {
    return false;
  }

  if (normalizedValue === normalizedGroup) {
    return false;
  }

  return true;
}

function shouldShowRationale(rationale: string | undefined, groupNote: string | undefined) {
  const normalizedRationale = String(rationale ?? "").trim();
  const normalizedGroup = String(groupNote ?? "").trim();

  if (!normalizedRationale) {
    return false;
  }

  if (normalizedRationale === normalizedGroup) {
    return false;
  }

  return true;
}

function shouldShowDistinctRationale(
  rationale: string | undefined,
  groupNote: string | undefined,
  mappingNote: string | undefined
) {
  const normalizedRationale = String(rationale ?? "").trim();
  const normalizedGroup = String(groupNote ?? "").trim();
  const normalizedMapping = String(mappingNote ?? "").trim();

  if (!normalizedRationale) {
    return false;
  }

  if (normalizedRationale === normalizedGroup) {
    return false;
  }

  if (normalizedRationale === normalizedMapping) {
    return false;
  }

  return true;
}

function buildCostCompositionSegments(costComposition: RecommendationState["costComposition"]) {
  const icd = Math.max(0, Number(costComposition?.icd ?? 0));
  const cls = Math.max(0, Number(costComposition?.cls ?? 0));
  const medications = Math.max(0, Number(costComposition?.medications ?? 0));
  const total = icd + cls + medications;

  if (total <= 0) {
    return [];
  }

  return [
    {
      key: "icd",
      label: "ICD",
      raw: icd,
      width: `${(icd / total) * 100}%`
    },
    {
      key: "cls",
      label: "CLS",
      raw: cls,
      width: `${(cls / total) * 100}%`
    },
    {
      key: "drug",
      label: "Thuốc",
      raw: medications,
      width: `${(medications / total) * 100}%`
    }
  ];
}

export default function DoctorWorkspace() {
  const [diagnosisCatalog, setDiagnosisCatalog] = useState<DiagnosisOption[]>(defaultDiagnosisOptions);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [state, setState] = useState<RecommendationState>(emptyState);
  const [status, setStatus] = useState("Sẵn sàng tra ICD.");
  const [loading, setLoading] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);
  const [itemStatuses, setItemStatuses] = useState<Record<string, ItemStatus>>({});
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackPayload, setFeedbackPayload] = useState<FeedbackPayload>({
    icdCode: "",
    icdName: "",
    feedbackType: "general",
    targetType: "general",
    targetName: "",
    note: ""
  });
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const costSegments = useMemo(() => buildCostCompositionSegments(state.costComposition), [state.costComposition]);

  const filteredOptions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return [];
    }

    return diagnosisCatalog
      .filter((item) => item.code.toLowerCase().includes(keyword) || item.label.toLowerCase().includes(keyword))
      .slice(0, 12);
  }, [diagnosisCatalog, searchTerm]);

  function toggleDiagnosis(code: string) {
    setSelectedCodes((current) => {
      if (current.includes(code)) {
        return current.filter((item) => item !== code);
      }

      if (current.length >= 5) {
        setStatus("Tối đa 5 chẩn đoán cùng lúc.");
        return current;
      }

      return [...current, code];
    });
    setSearchTerm("");
    setItemStatuses({});
  }

  function removeDiagnosis(code: string) {
    setSelectedCodes((current) => current.filter((item) => item !== code));
    setItemStatuses({});
  }

  function clearAllDiagnoses() {
    setSelectedCodes([]);
    setState(emptyState);
    setStatus("Sẵn sàng tra ICD.");
    setItemStatuses({});
  }

  function setItemStatus(name: string, status: ItemStatus) {
    setItemStatuses((current) => ({ ...current, [name]: status }));
  }

  function openFeedback(targetType: FeedbackPayload["targetType"], targetName: string) {
    const primaryDiag = state.diagnoses[0];
    setFeedbackPayload({
      icdCode: primaryDiag?.code ?? "",
      icdName: primaryDiag?.label ?? "",
      feedbackType: "general",
      targetType,
      targetName,
      note: ""
    });
    setFeedbackOpen(true);
    setFeedbackStatus("");
  }

  const submitFeedback = useCallback(async () => {
    if (!feedbackPayload.note.trim()) {
      setFeedbackStatus("Vui lòng nhập nội dung phản hồi.");
      return;
    }

    setFeedbackStatus("Đang gửi...");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackPayload)
      });
      const data = await response.json();

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.message ?? `HTTP ${response.status}`);
      }

      setFeedbackStatus("Đã gửi phản hồi thành công!");
      setTimeout(() => setFeedbackOpen(false), 1500);
    } catch (error) {
      setFeedbackStatus(`Lỗi: ${(error as Error).message}`);
    }
  }, [feedbackPayload]);

  useEffect(() => {
    async function loadDiagnosisCatalog() {
      try {
        const response = await fetch("/api/diagnoses/options", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok || !Array.isArray(payload?.options) || payload.options.length === 0) {
          throw new Error(payload?.message ?? `HTTP ${response.status}`);
        }

        const nextCatalog = payload.options.map((item: DiagnosisOption) => ({
          code: String(item.code),
          label: String(item.label)
        }));

        setDiagnosisCatalog(nextCatalog);
        setCatalogReady(true);
        setStatus("Đã nạp danh sách ICD.");
      } catch (error) {
        setDiagnosisCatalog(defaultDiagnosisOptions);
        setCatalogReady(true);
        setStatus(`Không nạp được ICD trực tuyến. Dùng danh sách sẵn có. ${(error as Error).message}`);
      }
    }

    void loadDiagnosisCatalog();
  }, []);

  useEffect(() => {
    async function loadRecommendations() {
      if (!catalogReady) {
        return;
      }

      if (selectedCodes.length === 0) {
        setState(emptyState);
        setStatus("Sẵn sàng tra ICD.");
        return;
      }

      setLoading(true);
      setStatus("Đang cập nhật gợi ý...");

      try {
        const response = await fetch("/api/recommendations/preview", {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify({
            action: "recommendations-preview",
            encounterCode: "OP-IM-0001",
            diagnoses: selectedCodes.map((code) => {
              const found = diagnosisCatalog.find((item) => item.code === code);

              return {
                icd: code,
                label: found?.label ?? code
              };
            })
          })
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          throw new Error(errorPayload?.message ?? `HTTP ${response.status}`);
        }

        const payload = await response.json();
        setState(normalizeRecommendationPayload(payload));
        setStatus("Đã cập nhật gợi ý theo ICD đang chọn.");
      } catch (error) {
        setState(buildLocalPreview(selectedCodes, diagnosisCatalog));
        setStatus(`Không lấy được dữ liệu trực tuyến. Đang dùng gợi ý dự phòng. ${(error as Error).message}`);
      } finally {
        setLoading(false);
      }
    }

    void loadRecommendations();
  }, [catalogReady, diagnosisCatalog, selectedCodes]);

  return (
    <main className="doctorWorkspace">
      <section className="doctorShell">
        <header className="doctorHero fade-1">
          <span className="eyebrow">Hỗ trợ ra quyết định lâm sàng</span>
          <h1>Chẩn đoán ICD-10 & Gợi ý xử trí BHYT phù hợp</h1>
          <p>Giao diện hiện đại giúp bác sĩ tập trung vào các quyết định quan trọng ngay trong đợt khám.</p>
        </header>

        <section className="doctorPanel fade-2">
          <div className="doctorPanelHeader">
            <h2>Tra cứu chẩn đoán (ICD-10)</h2>
            <span>{selectedCodes.length}/5 chẩn đoán đang chọn</span>
          </div>

          <div className="searchField">
            <span>BẮT ĐẦU VỚI TỪ KHÓA LÂM SÀNG</span>
            <div className="searchWrapper">
              <input
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nhập mã bệnh ICD-10 hoặc tên chẩn đoán (vd: L70, dạ dày...)"
                value={searchTerm}
              />
              {searchTerm && (
                <button className="clearSearch" onClick={() => setSearchTerm("")}>✕</button>
              )}
            </div>
          </div>

          <div className="searchResults">
            {filteredOptions.map((option) => {
              const selected = selectedCodes.includes(option.code);

              return (
                <button
                  className={selected ? "searchOption searchOption-selected" : "searchOption"}
                  key={option.code}
                  onClick={() => toggleDiagnosis(option.code)}
                  type="button"
                >
                  <strong>{option.label}</strong>
                  <span>{option.code}</span>
                </button>
              );
            })}
          </div>

          <div className="selectedDiagnosisRow">
            {state.diagnoses.map((diagnosis) => (
              <button className="selectedDiagnosisChip" key={`${diagnosis.code}-${diagnosis.label}`} onClick={() => removeDiagnosis(diagnosis.code)} type="button" title="Nhấp để xóa">
                <strong>{diagnosis.label}</strong>
                <span>{diagnosis.code}</span>
              </button>
            ))}
            {state.diagnoses.length > 1 ? (
              <button className="clearAllBtn" onClick={clearAllDiagnoses} type="button">Xóa tất cả</button>
            ) : null}
          </div>

          {state.costComposition ? (
            <div className="topCostPanel">
              <div className="topCostHeader">
                <strong>PHÂN TÍCH CƠ CẤU CHI PHÍ</strong>
                <span>Tương quan định mức giữa ICD, CLS và Thuốc theo quy tắc BHYT</span>
              </div>
              <div className="stackedCostTrack" aria-label="Cơ cấu chi phí tham chiếu">
                {costSegments.map((segment) => (
                  <div
                    className={`stackedCostFill stackedCostFill-${segment.key}`}
                    key={segment.key}
                    style={{ width: segment.width }}
                    title={`${segment.label}: ${segment.raw}%`}
                  />
                ))}
              </div>
              <div className="stackedCostLegend">
                {costSegments.map((segment) => (
                  <div className="stackedCostLegendItem" key={`legend-${segment.key}`}>
                    <span className={`stackedCostDot stackedCostDot-${segment.key}`} />
                    <strong>{segment.label}</strong>
                    <small>{segment.raw}%</small>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <p className="doctorStatus">{loading ? "Đang cập nhật gợi ý..." : status}</p>
        </section>

        <section className="doctorGrid">
          <section className="doctorPanel fade-3">
            <div className="doctorPanelHeader">
              <h2>Cận lâm sàng gợi ý</h2>
              <span>{state.investigations.length} mục</span>
            </div>
            <div className="doctorList">
              {state.investigationsNote ? <div className="groupNote">{state.investigationsNote}</div> : null}
              {state.investigations.length > 0 ? (
                state.investigations.map((item) => {
                  const itemStatus = itemStatuses[`cls-${item.name}`] ?? "pending";
                  return (
                    <article className={`doctorListItem doctorListItem-${itemStatus}`} key={item.name}>
                      <div className="itemHeader">
                        <strong>{item.name}</strong>
                        <div className="itemActions">
                          <button
                            className={itemStatus === "accepted" ? "actionBtn actionBtn-active" : "actionBtn"}
                            onClick={() => setItemStatus(`cls-${item.name}`, itemStatus === "accepted" ? "pending" : "accepted")}
                            title="Đồng ý"
                            type="button"
                          >✓</button>
                          <button
                            className={itemStatus === "dismissed" ? "actionBtn actionBtn-dismissed" : "actionBtn"}
                            onClick={() => setItemStatus(`cls-${item.name}`, itemStatus === "dismissed" ? "pending" : "dismissed")}
                            title="Bỏ qua"
                            type="button"
                          >✕</button>
                          <button
                            className="actionBtn actionBtn-feedback"
                            onClick={() => openFeedback("cls", item.name)}
                            title="Gửi phản hồi"
                            type="button"
                          >💬</button>
                        </div>
                      </div>
                      {shouldShowMappingNote(item.mappingNote, state.investigationsNote) ? (
                        <div className="itemMetaLabel">Ghi chú ICD: {item.mappingNote}</div>
                      ) : null}
                      {shouldShowSupplementalText(item.detail, state.investigationsNote, item.mappingNote || item.rationale) ? (
                        <div className="itemMetaLabel">Thông tin thêm: {item.detail}</div>
                      ) : null}
                      {shouldShowDistinctRationale(
                        item.rationale,
                        state.investigationsNote,
                        item.mappingNote || item.detail
                      ) ? (
                        <p>{item.rationale}</p>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <p className="emptyText">Chỉ chọn mã ICD để xem các đề xuất cận lâm sàng.</p>
              )}
            </div>
          </section>

          <section className="doctorPanel fade-3">
            <div className="doctorPanelHeader">
              <h2>Phác đồ Thuốc gợi ý</h2>
              <span>{state.medications.length} mục</span>
            </div>
            <div className="doctorList">
              {state.medicationsNote ? <div className="groupNote">{state.medicationsNote}</div> : null}
              {state.medications.length > 0 ? (
                state.medications.map((item) => {
                  const itemStatus = itemStatuses[`drug-${item.name}`] ?? "pending";
                  return (
                    <article className={`doctorListItem doctorListItem-${itemStatus}`} key={item.name}>
                      <div className="itemHeader">
                        <strong>{item.name}</strong>
                        <div className="itemActions">
                          <button
                            className={itemStatus === "accepted" ? "actionBtn actionBtn-active" : "actionBtn"}
                            onClick={() => setItemStatus(`drug-${item.name}`, itemStatus === "accepted" ? "pending" : "accepted")}
                            title="Đồng ý"
                            type="button"
                          >✓</button>
                          <button
                            className={itemStatus === "dismissed" ? "actionBtn actionBtn-dismissed" : "actionBtn"}
                            onClick={() => setItemStatus(`drug-${item.name}`, itemStatus === "dismissed" ? "pending" : "dismissed")}
                            title="Bỏ qua"
                            type="button"
                          >✕</button>
                          <button
                            className="actionBtn actionBtn-feedback"
                            onClick={() => openFeedback("medication", item.name)}
                            title="Gửi phản hồi"
                            type="button"
                          >💬</button>
                        </div>
                      </div>
                      {shouldShowMappingNote(item.mappingNote, state.medicationsNote) ? (
                        <div className="itemMetaLabel">Ghi chú ICD: {item.mappingNote}</div>
                      ) : null}
                      {shouldShowSupplementalText(item.detail, state.medicationsNote, item.mappingNote || item.rationale) ? (
                        <div className="itemMetaLabel">Thông tin thêm: {item.detail}</div>
                      ) : null}
                      {shouldShowDistinctRationale(
                        item.rationale,
                        state.medicationsNote,
                        item.mappingNote || item.detail
                      ) ? (
                        <p>{item.rationale}</p>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <p className="emptyText">Chỉ chọn mã ICD để xem các đề xuất kê đơn.</p>
              )}
            </div>
          </section>
        </section>

        <section className="doctorPanel fade-4">
          <div className="doctorPanelHeader">
            <h2>Rủi ro & Cảnh báo BHYT</h2>
            <span>Quy tắc giám định</span>
          </div>
          <div className="alertListSimple">
            {state.warningMessage ? (
              <article className="alertSimple alertSimple-medium">
                <strong>LƯU Ý QUAN TRỌNG</strong>
                <p>{state.warningMessage}</p>
              </article>
            ) : null}
            {state.recommendedAction ? (
              <article className="alertSimple alertSimple-low">
                <strong>HÀNH ĐỘNG KHUYÊN DÙNG</strong>
                <p>{state.recommendedAction}</p>
              </article>
            ) : null}
            {state.reimbursementNote ? (
              <article className="alertSimple alertSimple-low">
                <strong>LƯU Ý THANH TOÁN</strong>
                <p>{state.reimbursementNote}</p>
              </article>
            ) : null}
            {state.alerts.length > 0 ? (
              state.alerts.map((alert) => (
                <article className={`alertSimple alertSimple-${alert.severity}`} key={alert.title}>
                  <strong>{alert.title}</strong>
                  <p>{alert.description}</p>
                </article>
              ))
            ) : null}
            {!state.warningMessage && !state.recommendedAction && !state.reimbursementNote && state.alerts.length === 0 ? (
              <p className="emptyText">Hệ thống chưa phát hiện rủi ro thanh toán cho chẩn đoán này.</p>
            ) : null}
          </div>
        </section>

      </section>

      {feedbackOpen ? (
        <div className="feedbackOverlay" onClick={() => setFeedbackOpen(false)}>
          <div className="feedbackPanel" onClick={(e) => e.stopPropagation()}>
            <h3>Gửi phản hồi cho Admin</h3>
            <p className="feedbackContext">
              ICD: <strong>{feedbackPayload.icdCode}</strong> — {feedbackPayload.targetType !== "general" ? `${feedbackPayload.targetType}: ${feedbackPayload.targetName}` : "Phản hồi chung"}
            </p>
            <label>
              Loại phản hồi
              <select
                value={feedbackPayload.feedbackType}
                onChange={(e) => setFeedbackPayload((c) => ({ ...c, feedbackType: e.target.value as FeedbackPayload["feedbackType"] }))}
              >
                <option value="not_appropriate">Không phù hợp</option>
                <option value="missing">Thiếu gợi ý</option>
                <option value="need_adjustment">Cần điều chỉnh</option>
                <option value="general">Ý kiến chung</option>
              </select>
            </label>
            <label>
              Nội dung phản hồi
              <textarea
                rows={3}
                value={feedbackPayload.note}
                onChange={(e) => setFeedbackPayload((c) => ({ ...c, note: e.target.value }))}
                placeholder="Mô tả vấn đề hoặc gợi ý cải thiện..."
              />
            </label>
            <div className="feedbackActions">
              <button onClick={() => setFeedbackOpen(false)} type="button">Hủy</button>
              <button className="feedbackSubmit" onClick={submitFeedback} type="button">Gửi phản hồi</button>
            </div>
            {feedbackStatus ? <p className="feedbackStatusText">{feedbackStatus}</p> : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

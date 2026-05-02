"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useDiagnosisWorkspace } from "./hooks/useDiagnosisWorkspace";
import { useSymptomNarrowing } from "./hooks/useSymptomNarrowing";
import { DiagnosisSearch } from "./components/DiagnosisSearch";
import { SymptomSearch } from "./components/SymptomSearch";
import { RecommendationPanel } from "./components/RecommendationPanel";
import { AlertPanel } from "./components/AlertPanel";
import { CostChart } from "./components/CostChart";
import { FeedbackModal } from "./components/FeedbackModal";
import { ToastContainer } from "./components/ToastNotification";
import { EmptyState } from "./components/EmptyState";
import { IcdCoveragePanel } from "./components/IcdCoveragePanel";

type SearchMode = "symptom" | "icd";

export default function DoctorWorkspace() {
  const workspace = useDiagnosisWorkspace();
  const symptom = useSymptomNarrowing();
  const [searchMode, setSearchMode] = useState<SearchMode>("symptom");
  const [protocolMeta, setProtocolMeta] = useState<{ version: string; source: string } | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [lastActivityAt, setLastActivityAt] = useState<number>(Date.now());
  const [remainingMinutes, setRemainingMinutes] = useState(60);
  const SESSION_TIMEOUT_MS = 60 * 60 * 1000;

  useEffect(() => {
    async function fetchMeta() {
      try {
        const res = await fetch("/api/meta");
        const data = await res.json();
        setProtocolMeta(data);
      } catch (e) {
        console.error("Failed to fetch protocol metadata", e);
      }
    }
    void fetchMeta();
  }, []);

  useEffect(() => {
    if (!sessionStarted) return;

    const markActivity = () => setLastActivityAt(Date.now());
    const events: Array<keyof WindowEventMap> = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, markActivity, { passive: true }));

    const timer = window.setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((SESSION_TIMEOUT_MS - (now - lastActivityAt)) / 60000));
      setRemainingMinutes(remaining);
      if (now - lastActivityAt >= SESSION_TIMEOUT_MS) {
        setSessionStarted(false);
        workspace.clearAllDiagnoses();
      }
    }, 30_000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, markActivity));
      window.clearInterval(timer);
    };
  }, [sessionStarted, lastActivityAt, workspace]);

  // Bridge: when doctor selects an ICD from the narrowed list
  const handleSelectNarrowedIcd = useCallback(
    (code: string) => {
      workspace.toggleDiagnosis(code);
    },
    [workspace]
  );

  return (
    <main className="doctorWorkspace">
      {!sessionStarted ? (
        <section className="doctorShell" style={{ maxWidth: 980, margin: "40px auto" }}>
          <header className="doctorHero fade-1">
            <span className="eyebrow">Khởi tạo phiên làm việc</span>
            <h1>Thiết lập hồ sơ phiên trước khi vào hệ thống gợi ý</h1>
            <p className="heroDesc">
              Phiên làm việc sẽ tự thoát nếu không có thao tác trong khoảng 1 giờ để bảo đảm an toàn dữ liệu.
            </p>
          </header>
          <section className="doctorPanel fade-2">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>
              <label>
                Chuyên khoa
                <select
                  value={workspace.sessionProfile.specialty}
                  onChange={(e) => workspace.setSessionProfile((prev) => ({ ...prev, specialty: e.target.value }))}
                >
                  <option value="general">Tổng quát</option>
                  <option value="cardiology">Tim mạch</option>
                  <option value="endocrine">Nội tiết</option>
                  <option value="neurology">Thần kinh</option>
                  <option value="ent">Tai Mũi Họng</option>
                  <option value="dermatology">Da liễu</option>
                </select>
              </label>
              <label>
                Kinh nghiệm
                <select
                  value={workspace.sessionProfile.experience}
                  onChange={(e) => workspace.setSessionProfile((prev) => ({ ...prev, experience: e.target.value }))}
                >
                  <option value="unspecified">Chưa chọn</option>
                  <option value="junior">&lt; 2 năm</option>
                  <option value="mid">2-5 năm</option>
                  <option value="senior">5-10 năm</option>
                  <option value="expert">&gt; 10 năm</option>
                </select>
              </label>
              <label>
                Mức hỗ trợ
                <select
                  value={workspace.sessionProfile.assistMode}
                  onChange={(e) => workspace.setSessionProfile((prev) => ({ ...prev, assistMode: e.target.value }))}
                >
                  <option value="full">Gợi ý đầy đủ</option>
                  <option value="concise">Gợi ý ngắn gọn</option>
                  <option value="risk-only">Ưu tiên cảnh báo nguy cơ cao</option>
                </select>
              </label>
            </div>
            <div style={{ marginTop: 14 }}>
              <button
                className="modeBtn modeBtn-active"
                type="button"
                onClick={() => {
                  setLastActivityAt(Date.now());
                  setRemainingMinutes(60);
                  setSessionStarted(true);
                }}
              >
                Bắt đầu phiên làm việc
              </button>
            </div>
          </section>
        </section>
      ) : (
      <>
      <header className="appHeader fade-1">
        <div className="logoContainer">
          <Image src="/logo.png" alt="Logo PNT" width={70} height={70} priority />
        </div>
        <div className="headerTitles">
          <h1 className="headerTitleMain">PHÒNG KHÁM ĐA KHOA</h1>
          <h2 className="headerTitleSub">TRƯỜNG ĐẠI HỌC Y KHOA PHẠM NGỌC THẠCH</h2>
        </div>
      </header>

      <section className="doctorShell">
        <div className="doctorPanel" style={{ marginBottom: 12 }}>
          <strong>Phiên ẩn danh đang hoạt động.</strong>{" "}
          <span>Hết hạn sau khoảng {remainingMinutes} phút nếu không thao tác.</span>
          <button
            type="button"
            className="clearAllBtn"
            style={{ marginLeft: 12 }}
            onClick={() => {
              setSessionStarted(false);
              workspace.clearAllDiagnoses();
            }}
          >
            Kết thúc phiên
          </button>
        </div>
        <header className="doctorHero fade-1">
          <span className="eyebrow">Hỗ trợ ra quyết định lâm sàng</span>
          <h1>Chẩn đoán bộ Triệu chứng, ICD-10 & Gợi ý xử trí</h1>
          <div className="heroSubText">
            <div className="heroFeaturesRow">
              <div className="heroFeatureCard">
                <div className="hfIcon">📚</div>
                <div className="hfText">
                  <strong>Tuân thủ EBM</strong>
                  <span>Bám sát cập nhật Y học bằng chứng mới nhất.</span>
                </div>
              </div>
              <div className="heroFeatureCard">
                <div className="hfIcon">🤝</div>
                <div className="hfText">
                  <strong>Tích hợp IPE</strong>
                  <span>Liên kết Đa chuyên khoa trong điều trị.</span>
                </div>
              </div>
            </div>
            <p className="heroDesc">
              Giao diện tiện dụng giúp bác sĩ giải phóng áp lực thủ tục và tập trung tối đa vào chuyên môn.
            </p>
          </div>
        </header>


        <IcdCoveragePanel />
        <section className="doctorPanel fade-2" style={{ marginTop: 12 }}>
          <div className="doctorPanelHeader">
            <h2>Hồ sơ phiên làm việc (ẩn danh)</h2>
            <span>Tối ưu gợi ý theo nhóm bác sĩ</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>
            <label>
              Chuyên khoa
              <select
                value={workspace.sessionProfile.specialty}
                onChange={(e) => workspace.setSessionProfile((prev) => ({ ...prev, specialty: e.target.value }))}
              >
                <option value="general">Tổng quát</option>
                <option value="cardiology">Tim mạch</option>
                <option value="endocrine">Nội tiết</option>
                <option value="neurology">Thần kinh</option>
                <option value="ent">Tai Mũi Họng</option>
                <option value="dermatology">Da liễu</option>
              </select>
            </label>
            <label>
              Kinh nghiệm
              <select
                value={workspace.sessionProfile.experience}
                onChange={(e) => workspace.setSessionProfile((prev) => ({ ...prev, experience: e.target.value }))}
              >
                <option value="unspecified">Chưa chọn</option>
                <option value="junior">&lt; 2 năm</option>
                <option value="mid">2-5 năm</option>
                <option value="senior">5-10 năm</option>
                <option value="expert">&gt; 10 năm</option>
              </select>
            </label>
            <label>
              Mức hỗ trợ
              <select
                value={workspace.sessionProfile.assistMode}
                onChange={(e) => workspace.setSessionProfile((prev) => ({ ...prev, assistMode: e.target.value }))}
              >
                <option value="full">Gợi ý đầy đủ</option>
                <option value="concise">Gợi ý ngắn gọn</option>
                <option value="risk-only">Ưu tiên cảnh báo nguy cơ cao</option>
              </select>
            </label>
          </div>
        </section>
        <section className="doctorPanel fade-2">
          {/* Mode Toggle */}
          <div className="modeToggle">
            <button
              className={`modeBtn${searchMode === "symptom" ? " modeBtn-active" : ""}`}
              onClick={() => setSearchMode("symptom")}
              type="button"
              id="mode-symptom-btn"
            >
              <span className="modeBtnIcon">🩺</span>
              Tìm theo triệu chứng
            </button>
            <button
              className={`modeBtn${searchMode === "icd" ? " modeBtn-active" : ""}`}
              onClick={() => setSearchMode("icd")}
              type="button"
              id="mode-icd-btn"
            >
              <span className="modeBtnIcon">📋</span>
              Nhập trực tiếp ICD
            </button>
          </div>

          {/* Symptom Search Mode */}
          {searchMode === "symptom" && (
            <SymptomSearch
              symptomSearch={symptom.symptomSearch}
              setSymptomSearch={symptom.setSymptomSearch}
              symptomOptions={symptom.symptomOptions}
              selectedSymptoms={symptom.selectedSymptoms}
              narrowedIcds={symptom.narrowedIcds}
              narrowingLoading={symptom.narrowingLoading}
              maxScore={symptom.maxScore}
              addSymptom={symptom.addSymptom}
              removeSymptom={symptom.removeSymptom}
              clearAllSymptoms={symptom.clearAllSymptoms}
              onSelectIcd={handleSelectNarrowedIcd}
            />
          )}

          {/* Direct ICD Search Mode */}
          {searchMode === "icd" && (
            <>
              <div className="doctorPanelHeader">
                <h2>Tra cứu chẩn đoán (ICD-10)</h2>
                <span>{workspace.selectedCodes.length}/5 chẩn đoán đang chọn</span>
              </div>
              <DiagnosisSearch
                searchTerm={workspace.searchTerm}
                setSearchTerm={workspace.setSearchTerm}
                filteredOptions={workspace.filteredOptions}
                selectedCodes={workspace.selectedCodes}
                diagnoses={workspace.state.diagnoses}
                toggleDiagnosis={workspace.toggleDiagnosis}
                removeDiagnosis={workspace.removeDiagnosis}
                clearAllDiagnoses={workspace.clearAllDiagnoses}
              />
            </>
          )}

          {/* Selected ICD chips (always visible) */}
          {workspace.selectedCodes.length > 0 && searchMode === "symptom" && (
            <div className="selectedIcdFromSymptom">
              <h4>ICD đã chọn ({workspace.selectedCodes.length}/5)</h4>
              <div className="selectedDiagnosisRow">
                {workspace.state.diagnoses.map((diagnosis: { code: string; label: string }) => (
                  <button
                    className="selectedDiagnosisChip"
                    key={`${diagnosis.code}-${diagnosis.label}`}
                    onClick={() => workspace.removeDiagnosis(diagnosis.code)}
                    type="button"
                    title="Nhấp để xóa"
                  >
                    <strong>{diagnosis.label}</strong>
                    <span>{diagnosis.code}</span>
                  </button>
                ))}
                {workspace.state.diagnoses.length > 1 && (
                  <button
                    className="clearAllBtn"
                    onClick={workspace.clearAllDiagnoses}
                    type="button"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
            </div>
          )}

          <CostChart segments={workspace.costSegments} />

          <p className="doctorStatus">{workspace.loading ? "Đang cập nhật gợi ý..." : workspace.status}</p>
        </section>

        {workspace.selectedCodes.length === 0 && !workspace.loading ? (
          <EmptyState />
        ) : (
          <>
            <section className="doctorGrid">
              <RecommendationPanel
                title="Cận lâm sàng gợi ý"
                items={workspace.state.investigations}
                groupNote={workspace.state.investigationsNote}
                prefix="cls"
                loading={workspace.loading}
                itemStatuses={workspace.itemStatuses}
                onSetStatus={workspace.setItemStatus}
                onOpenFeedback={workspace.openFeedback}
                feedbackTargetType="cls"
                emptyText="Vui lòng chọn ICD để xem gợi ý cận lâm sàng."
                icdCode={workspace.selectedCodes[0]}
                onSearch={workspace.searchCatalog}
              />
              <RecommendationPanel
                title="Nhóm thuốc khuyến nghị"
                items={workspace.state.medications}
                groupNote={workspace.state.medicationsNote}
                prefix="drug"
                loading={workspace.loading}
                itemStatuses={workspace.itemStatuses}
                onSetStatus={workspace.setItemStatus}
                onOpenFeedback={workspace.openFeedback}
                feedbackTargetType="medication"
                emptyText="Vui lòng chọn ICD để xem khuyến nghị dùng thuốc."
                icdCode={workspace.selectedCodes[0]}
                onSearch={workspace.searchCatalog}
              />
            </section>

            <AlertPanel
              alerts={workspace.state.alerts}
              warningMessage={workspace.state.warningMessage}
              recommendedAction={workspace.state.recommendedAction}
              reimbursementNote={workspace.state.reimbursementNote}
              riskScore={workspace.state.riskScore}
              suggestedJustification={workspace.state.suggestedJustification}
            />
          </>
        )}
      </section>

      <FeedbackModal
        open={workspace.feedbackOpen}
        payload={workspace.feedbackPayload}
        status={workspace.feedbackStatus}
        onClose={workspace.closeFeedback}
        onUpdatePayload={workspace.updateFeedbackPayload}
        onSubmit={workspace.submitFeedback}
      />

      <ToastContainer
        toasts={workspace.toasts}
        onDismiss={workspace.dismissToast}
      />

      <footer className="appFooter fade-4">
        <p>Phòng Kế hoạch Nghiệp vụ</p>
        <p>Bản quyền © 2026 — Phiên bản <strong>phác đồ {protocolMeta?.version || "v0.0.0"}</strong> ({protocolMeta?.source === "local-csv" ? "Dữ liệu CSV" : "Dữ liệu Hệ thống"})</p>
      </footer>
      </>
      )}
    </main>
  );
}

"use client";

import { useState, useCallback } from "react";
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

type SearchMode = "symptom" | "icd";

export default function DoctorWorkspace() {
  const workspace = useDiagnosisWorkspace();
  const symptom = useSymptomNarrowing();
  const [searchMode, setSearchMode] = useState<SearchMode>("symptom");

  // Bridge: when doctor selects an ICD from the narrowed list
  const handleSelectNarrowedIcd = useCallback(
    (code: string) => {
      workspace.toggleDiagnosis(code);
    },
    [workspace]
  );

  return (
    <main className="doctorWorkspace">
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
                emptyText="Chỉ chọn mã ICD để xem các đề xuất cận lâm sàng."
              />
              <RecommendationPanel
                title="Phác đồ Thuốc gợi ý"
                items={workspace.state.medications}
                groupNote={workspace.state.medicationsNote}
                prefix="drug"
                loading={workspace.loading}
                itemStatuses={workspace.itemStatuses}
                onSetStatus={workspace.setItemStatus}
                onOpenFeedback={workspace.openFeedback}
                feedbackTargetType="medication"
                emptyText="Chỉ chọn mã ICD để xem các đề xuất kê đơn."
              />
            </section>

            <AlertPanel
              alerts={workspace.state.alerts}
              warningMessage={workspace.state.warningMessage}
              recommendedAction={workspace.state.recommendedAction}
              reimbursementNote={workspace.state.reimbursementNote}
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
        <p>Phòng Kế hoạch Tổng hợp & Nghiệp vụ Y</p>
        <p>Bản quyền © 2026 — Phiên bản <strong>v0.2.0</strong></p>
      </footer>
    </main>
  );
}

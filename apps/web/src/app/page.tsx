"use client";

import { useDiagnosisWorkspace } from "./hooks/useDiagnosisWorkspace";
import { DiagnosisSearch } from "./components/DiagnosisSearch";
import { RecommendationPanel } from "./components/RecommendationPanel";
import { AlertPanel } from "./components/AlertPanel";
import { CostChart } from "./components/CostChart";
import { FeedbackModal } from "./components/FeedbackModal";
import { ToastContainer } from "./components/ToastNotification";
import { EmptyState } from "./components/EmptyState";

export default function DoctorWorkspace() {
  const workspace = useDiagnosisWorkspace();

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
    </main>
  );
}

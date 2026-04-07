"use client";

import { useAdminWorkspace } from "./hooks/useAdminWorkspace";
import { AdminSidebar } from "./components/AdminSidebar";
import { HeroHeader } from "./components/HeroHeader";
import { OverviewGrid } from "./components/OverviewGrid";
import { IcdConfigList } from "./components/IcdConfigList";
import { IcdIntakeForm } from "./components/IcdIntakeForm";
import { TechnicalPanel } from "./components/TechnicalPanel";
import { FooterPanels } from "./components/FooterPanels";

export default function AdminHome() {
    const workspace = useAdminWorkspace();

    return (
        <div className="adminShell">
            <AdminSidebar status={workspace.status} />

            <main className="adminContent fade-up">
                <HeroHeader
                    copyStatus={workspace.copyStatus}
                    loading={workspace.loading}
                    onRefreshAll={() => void workspace.refreshAll()}
                    onLoadPreview={() => void workspace.loadPreview()}
                    onLoadTemplate={() => void workspace.loadTemplate()}
                    onInspectWorkbook={() => void workspace.inspectWorkbook()}
                    onLoadChangeLog={() => void workspace.loadChangeLog()}
                />

                <OverviewGrid
                    inspect={workspace.inspect}
                    preview={workspace.preview}
                    isMounted={workspace.isMounted}
                    ruleClaimRiskCount={
                        workspace.preview?.tabs.find((t) => t.name === "rule_claim_risk")?.rowCount || 0
                    }
                />

                <IcdConfigList
                    configuredIcdRows={workspace.configuredIcdRows}
                    filteredConfiguredIcdRows={workspace.filteredConfiguredIcdRows}
                    icdSearchTerm={workspace.icdSearchTerm}
                    activeIcdCode={workspace.activeIcdCode}
                    onIcdSearchChange={workspace.setIcdSearchTerm}
                    onLoadIcd={workspace.loadIcdIntoForm}
                />

                <IcdIntakeForm
                    quickCreate={workspace.quickCreate}
                    activeIcdCode={workspace.activeIcdCode}
                    loading={workspace.loading}
                    clsCatalogRows={workspace.clsCatalogRows}
                    medicationCatalogRows={workspace.medicationCatalogRows}
                    selectedClsLabels={workspace.selectedClsLabels}
                    selectedDrugLabels={workspace.selectedDrugLabels}
                    selectedClsDetails={workspace.selectedClsDetails}
                    selectedDrugDetails={workspace.selectedDrugDetails}
                    activeCostTotal={workspace.activeCostTotal}
                    costSuggestions={workspace.costSuggestions}
                    lastCreatedCatalogEntry={workspace.lastCreatedCatalogEntry}
                    dragState={workspace.dragState}
                    quickAddCls={workspace.quickAddCls}
                    quickAddMedication={workspace.quickAddMedication}
                    onSetQuickCreate={workspace.setQuickCreate}
                    onSetActiveIcdCode={workspace.setActiveIcdCode}
                    onSetDragState={workspace.setDragState}
                    onSetQuickAddCls={workspace.setQuickAddCls}
                    onSetQuickAddMedication={workspace.setQuickAddMedication}
                    onCreateQuickBundle={() => void workspace.createQuickBundle()}
                    onCreateCatalogEntry={(kind) => void workspace.createCatalogEntry(kind)}
                    onApplyCostSuggestion={workspace.applyCostSuggestion}
                />

                <TechnicalPanel
                    technicalOpen={workspace.technicalOpen}
                    template={workspace.template}
                    inspect={workspace.inspect}
                    preview={workspace.preview}
                    changeLog={workspace.changeLog}
                    selectedPreviewTab={workspace.selectedPreviewTab}
                    searchTerm={workspace.searchTerm}
                    normalizedSearchTerm={workspace.normalizedSearchTerm}
                    logTabFilter={workspace.logTabFilter}
                    logKeyword={workspace.logKeyword}
                    normalizedLogKeyword={workspace.normalizedLogKeyword}
                    loading={workspace.loading}
                    selectedRecord={workspace.selectedRecord}
                    editDraft={workspace.editDraft}
                    saveNote={workspace.saveNote}
                    filteredPreviewTabs={workspace.filteredPreviewTabs}
                    filteredChangeLogRows={workspace.filteredChangeLogRows}
                    onToggle={() => workspace.setTechnicalOpen((current) => !current)}
                    onSelectedPreviewTabChange={workspace.setSelectedPreviewTab}
                    onSearchTermChange={workspace.setSearchTerm}
                    onLogTabFilterChange={workspace.setLogTabFilter}
                    onLogKeywordChange={workspace.setLogKeyword}
                    onExportCsv={workspace.exportFilteredCsv}
                    onCopyCode={(value) => void workspace.copyCode(value)}
                    onOpenRecord={workspace.openRecord}
                    onEditDraftChange={(patch) =>
                        workspace.setEditDraft((current) => ({ ...current, ...patch }))
                    }
                    onSaveNoteChange={workspace.setSaveNote}
                    onSaveRecord={() => void workspace.saveRecord()}
                    onResetDraft={workspace.resetDraft}
                />

                <FooterPanels
                    quickCreate={workspace.quickCreate}
                    onUpdate={(patch) => workspace.setQuickCreate((current) => ({ ...current, ...patch }))}
                />
            </main>
        </div>
    );
}

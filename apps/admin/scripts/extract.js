const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../src/app/page.tsx');
const componentsDir = path.join(__dirname, '../src/app/components');
const constantsPath = path.join(__dirname, '../src/app/constants.ts');

if (!fs.existsSync(componentsDir)) fs.mkdirSync(componentsDir, { recursive: true });

function sliceLines(fileLines, startLine, endLine) {
    return fileLines.slice(startLine - 1, endLine).join('\n');
}

const content = fs.readFileSync(pagePath, 'utf8');
const lines = content.split('\n');

const comps = {
    AdminSidebar: [1279, 1307],
    AdminHeader: [1310, 1319],
    CommandBar: [1321, 1334],
    OverviewGrid: [1336, 1357],
    ConfiguredIcdList: [1359, 1416],
    QuickCreateModal: [1418, 2180],
    TechnicalTools: [2182, 2472],
    ProtocolVersions: [2474, 2493],
    RuleSetPriority: [2496, 2563],
    GovernanceMetrics: [2565, 2578],
};

Object.entries(comps).forEach(([name, [start, end]]) => {
    const compCode = sliceLines(lines, start, end);
    const fileContent = `import React from 'react';
import { useAdminWorkspace } from '../hooks/useAdminWorkspace';
import { protocolVersions, metrics, previewTabs, tabGroups, tabLabels, ruleSets } from '../constants';
import { highlightText, formatCellValue, getPrimaryCode, getPrimaryKeyField } from '../utils/admin-helpers';

export function ${name}(props: ReturnType<typeof useAdminWorkspace>) {
  const {
      isMounted, dragState, setDragState, template, inspect, preview,
      selectedPreviewTab, setSelectedPreviewTab, searchTerm, setSearchTerm,
      copyStatus, status, loading, selectedRecord, editDraft, setEditDraft,
      saveNote, setSaveNote, changeLog, logTabFilter, setLogTabFilter, logKeyword,
      setLogKeyword, icdSearchTerm, setIcdSearchTerm, activeIcdCode, setActiveIcdCode,
      technicalOpen, setTechnicalOpen, quickCreate, setQuickCreate, quickAddCls,
      setQuickAddCls, quickAddMedication, setQuickAddMedication, lastCreatedCatalogEntry,
      loadTemplate, inspectWorkbook, loadPreview, copyCode, loadChangeLog, refreshAll,
      exportFilteredCsv, openRecord, resetDraft, saveRecord, createQuickBundle,
      createCatalogEntry, applyCostSuggestion, loadIcdIntoForm, normalizedSearchTerm,
      normalizedLogKeyword, filteredPreviewTabs, filteredChangeLogRows, clsCatalogRows,
      medicationCatalogRows, configuredIcdRows, configuredCostProfiles,
      filteredConfiguredIcdRows, activeCostTotal, costSuggestions, summaryCards,
      selectedClsLabels, selectedDrugLabels, selectedClsDetails, selectedDrugDetails,
      createEmptyQuickCreate
  } = props;

  return (
${compCode}
  );
}
`;
    fs.writeFileSync(path.join(componentsDir, `${name}.tsx`), fileContent);
});

// Using indexOf to extract constants
const startConst = lines.findIndex(l => l.includes('const protocolVersions = ['));
const endConst = lines.findIndex(l => l.includes('export function AdminHome()')) - 1; // wait, the function is default export AdminHome

let actualEndConst = lines.findIndex(l => l.includes('export default function AdminHome()'));
if (actualEndConst === -1) actualEndConst = lines.findIndex(l => l.includes('function AdminHome()'));

if (startConst !== -1 && actualEndConst !== -1) {
    const constantsCode = sliceLines(lines, startConst + 1, actualEndConst);
    fs.writeFileSync(constantsPath, "export " + constantsCode.replace(/^const /gm, 'export const '));
    console.log("Extracted constants from lines", startConst + 1, "to", actualEndConst);
}

// Write the new page.tsx
const newPageCode = `"use client";

import { useAdminWorkspace } from "./hooks/useAdminWorkspace";
import { AdminSidebar } from "./components/AdminSidebar";
import { AdminHeader } from "./components/AdminHeader";
import { CommandBar } from "./components/CommandBar";
import { OverviewGrid } from "./components/OverviewGrid";
import { ConfiguredIcdList } from "./components/ConfiguredIcdList";
import { QuickCreateModal } from "./components/QuickCreateModal";
import { TechnicalTools } from "./components/TechnicalTools";
import { ProtocolVersions } from "./components/ProtocolVersions";
import { RuleSetPriority } from "./components/RuleSetPriority";
import { GovernanceMetrics } from "./components/GovernanceMetrics";

export default function AdminHome() {
  const workspace = useAdminWorkspace();

  return (
    <div className="adminShell">
      <AdminSidebar {...workspace} />
      <main className="adminContent fade-up">
        <AdminHeader {...workspace} />
        <CommandBar {...workspace} />
        <OverviewGrid {...workspace} />
        <ConfiguredIcdList {...workspace} />
        <QuickCreateModal {...workspace} />
        <TechnicalTools {...workspace} />
        <ProtocolVersions {...workspace} />
        <section className="dualGrid">
          <RuleSetPriority {...workspace} />
          <GovernanceMetrics {...workspace} />
        </section>
      </main>
    </div>
  );
}
`;
fs.writeFileSync(pagePath, newPageCode);

console.log("Extracted components and replaced page.tsx successfully.");

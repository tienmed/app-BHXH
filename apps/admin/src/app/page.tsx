"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

type TemplatePayload = {
  workbookName: string;
  tabs: string[];
};

type WorkbookInspectPayload = {
  workbookName: string;
  workbookId: string;
  ready: boolean;
  tabs: Array<{
    name: string;
    exists: boolean;
    rowCount: number;
    columnCount: number;
    headers: string[];
    missingColumns: string[];
  }>;
};

type PreviewRow = Record<string, string | number | boolean | null>;

type WorkbookPreviewPayload = {
  workbookName: string;
  workbookId: string;
  tabs: Array<{
    name: string;
    headers: string[];
    rowCount: number;
    rows: PreviewRow[];
  }>;
};

type SelectedRecord = {
  tabName: string;
  row: PreviewRow;
};

type ChangeLogPayload = {
  total: number;
  rows: Array<Record<string, string | number | boolean | null>>;
};

type QuickCreateState = {
  icdCode: string;
  icdName: string;
  chapter: string;
  protocolName: string;
  protocolStatus: string;
  protocolOwner: string;
  primaryRuleSet: string;
  rulePriorityLevel: string;
  ruleFocus: string;
  ruleIsActive: boolean;
  description: string;
  careSetting: string;
  ageGroup: string;
  visitContext: string;
  triggerSymptoms: string;
  contraindications: string;
  severity: string;
  labPurposeNote: string;
  medicationRoleNote: string;
  warningMessage: string;
  recommendedAction: string;
  reimbursementNote: string;
  note: string;
  systemSupportNote: string;
  icdRatioMax: string;
  clsRatioMax: string;
  drugRatioMax: string;
  clsCodes: string[];
  drugCodes: string[];
  clsMappingNotes: Record<string, string>;
  drugMappingNotes: Record<string, string>;
  clsRepeatFrequencies: Record<string, string>;
};

type MappingDetailItem = {
  code: string;
  name: string;
  group: string;
  catalogHint: string;
  note: string;
};

type CostSuggestionItem = {
  key: string;
  title: string;
  description: string;
  icdRatio: string;
  clsRatio: string;
  drugRatio: string;
  tone: "primary" | "reference" | "default";
};

const protocolVersions = [
  {
    name: "Nội khoa ngoại trú - tăng huyết áp / đái tháo đường",
    version: "MOH-SEED-2026.01",
    status: "Đang dùng làm seed",
    note: "Khởi tạo từ khuyến nghị Bộ Y tế, chờ đối chiếu danh mục phòng khám."
  },
  {
    name: "Hàng chờ điều chỉnh riêng",
    version: "CLINIC-DRAFT-0",
    status: "Dự kiến",
    note: "Dùng cho giai đoạn bổ sung quy tắc riêng khi pilot đã có feedback thật."
  }
];

const ruleSets = [
  {
    id: "claim-basic",
    name: "Rule set xuất toán cơ bản",
    coverage: "ICD + CLS + thuốc",
    state: "Nền tảng thiết kế",
    note: "Mục tiêu là cảnh báo trước, không khóa luồng thao tác bác sĩ."
  },
  {
    id: "repeat-frequency",
    name: "Tần suất chỉ định lặp lại",
    coverage: "Xét nghiệm lặp trong khoảng ngắn",
    state: "Ưu tiên cao",
    note: "Nhóm quy tắc dự kiến mang lại hiệu quả pilot sớm."
  },
  {
    id: "medication-mapping",
    name: "Mapping danh mục thuốc",
    coverage: "Thuốc khuyến nghị vs thuốc được phép",
    state: "Cần bổ sung dữ liệu",
    note: "Cần danh mục thuốc thực tế của phòng khám để hoàn tất."
  }
];

const metrics = [
  { label: "Mức sẵn sàng của protocol seed", value: "68%" },
  { label: "Độ đầy đủ của phần giải thích rule", value: "52%" },
  { label: "Độ phủ mapping danh mục", value: "31%" },
  { label: "Độ rõ của governance pilot", value: "80%" }
];

const previewTabs = [
  "catalog_icd",
  "catalog_cls",
  "catalog_medication",
  "protocol_header",
  "protocol_item",
  "rule_cost_composition",
  "mapping_icd_cls",
  "mapping_icd_medication",
  "rule_claim_risk"
];

const tabGroups = [
  {
    label: "Danh mục",
    tabs: ["catalog_icd", "catalog_cls", "catalog_medication"]
  },
  {
    label: "Mapping",
    tabs: ["mapping_icd_cls", "mapping_icd_medication"]
  },
  {
    label: "Quy tắc",
    tabs: ["rule_claim_risk"]
  }
];

const tabLabels: Record<string, string> = {
  catalog_icd: "Danh mục ICD",
  catalog_cls: "Danh mục cận lâm sàng",
  catalog_medication: "Danh mục thuốc",
  mapping_icd_cls: "Mapping ICD -> CLS",
  mapping_icd_medication: "Mapping ICD -> thuá»‘c",
  rule_claim_risk: "Rule cảnh báo xuất toán"
};

function createEmptyQuickCreate(): QuickCreateState {
  return {
    icdCode: "",
    icdName: "",
    chapter: "Nội khoa",
    protocolName: "",
    protocolStatus: "active",
    protocolOwner: "Phòng khám",
    primaryRuleSet: "claim-basic",
    rulePriorityLevel: "high",
    ruleFocus: "Cảnh báo trước xuất toán",
    ruleIsActive: true,
    description: "",
    careSetting: "Ngoại trú",
    ageGroup: "Người lớn",
    visitContext: "Khám mới hoặc tái khám",
    triggerSymptoms: "",
    contraindications: "",
    severity: "medium",
    labPurposeNote: "",
    medicationRoleNote: "",
    warningMessage: "",
    recommendedAction: "",
    reimbursementNote: "",
    note: "",
    systemSupportNote: "",
    icdRatioMax: "30",
    clsRatioMax: "40",
    drugRatioMax: "30",
    clsCodes: [],
    drugCodes: [],
    clsMappingNotes: {},
    drugMappingNotes: {},
    clsRepeatFrequencies: {}
  };
}

function parseRuleProfile(value: string | number | boolean | null | undefined) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(String(value)) as Partial<QuickCreateState>;
  } catch {
    return {};
  }
}

function normalizeIcdLookup(code: string) {
  return code.trim().toUpperCase().replace(/\./g, "");
}

function getPresetCostSuggestion(icdCode: string, icdName: string) {
  const normalizedCode = normalizeIcdLookup(icdCode);
  const normalizedName = icdName.trim();

  const presets: Record<string, Omit<CostSuggestionItem, "key" | "tone">> = {
    I10: {
      title: "Gợi ý cho tăng huyết áp ngoại trú",
      description: "Ưu tiên phần khám, đánh giá nền và thuốc duy trì; CLS ở mức chọn lọc.",
      icdRatio: "40",
      clsRatio: "25",
      drugRatio: "35"
    },
    E119: {
      title: "Gợi ý cho đái tháo đường típ 2",
      description: "Cần cân bằng giữa đánh giá ICD, CLS theo dõi và thuốc nền dài hạn.",
      icdRatio: "35",
      clsRatio: "35",
      drugRatio: "30"
    },
    L02: {
      title: "Gợi ý cho áp xe da / nhọt",
      description: "Ưu tiên khám lâm sàng và thuốc; CLS chỉ mở rộng khi có dấu hiệu nặng.",
      icdRatio: "35",
      clsRatio: "25",
      drugRatio: "40"
    },
    L70: {
      title: "Gợi ý cho mụn trứng cá",
      description: "Đa số dựa trên khám lâm sàng; CLS thấp, thuốc và chăm sóc da chiếm tỷ trọng chính.",
      icdRatio: "55",
      clsRatio: "10",
      drugRatio: "35"
    },
    J00: {
      title: "Gợi ý cho viêm mũi họng cấp thông thường",
      description: "Chẩn đoán chủ yếu bằng lâm sàng, CLS thấp, thuốc triệu chứng ở mức vừa phải.",
      icdRatio: "45",
      clsRatio: "15",
      drugRatio: "40"
    },
    J01: {
      title: "Gợi ý cho viêm xoang cấp",
      description: "Giữ cân bằng giữa đánh giá ICD, CLS chọn lọc và thuốc điều trị triệu chứng / kháng sinh khi cần.",
      icdRatio: "35",
      clsRatio: "30",
      drugRatio: "35"
    },
    E78: {
      title: "Gợi ý cho rối loạn lipid máu",
      description: "Cần bộ xét nghiệm nền hợp lý nhưng vẫn giữ trọng tâm vào đánh giá nguy cơ và thuốc nền.",
      icdRatio: "35",
      clsRatio: "35",
      drugRatio: "30"
    }
  };

  const exactPreset = presets[normalizedCode];

  if (exactPreset) {
    return {
      key: `preset-${normalizedCode}`,
      tone: "primary" as const,
      ...exactPreset
    };
  }

  return {
    key: `preset-default-${normalizedCode || "new"}`,
    title: normalizedName ? `Gợi ý mặc định cho ${normalizedName}` : "Gợi ý mặc định cho ICD mới",
    description: "Dùng khi chưa có cấu hình lịch sử: giữ tương quan cân bằng giữa ICD, CLS và thuốc.",
    icdRatio: "35",
    clsRatio: "30",
    drugRatio: "35",
    tone: "default" as const
  };
}

function normalizeTemplatePayload(payload: unknown): TemplatePayload {
  const source = payload as Partial<TemplatePayload> | null;

  return {
    workbookName: typeof source?.workbookName === "string" ? source.workbookName : "Chưa rõ tên workbook",
    tabs: Array.isArray(source?.tabs) ? source.tabs.map((item) => String(item)) : []
  };
}

function normalizeInspectPayload(payload: unknown): WorkbookInspectPayload {
  const source = payload as Partial<WorkbookInspectPayload> | null;

  return {
    workbookName: typeof source?.workbookName === "string" ? source.workbookName : "Chưa rõ tên workbook",
    workbookId: typeof source?.workbookId === "string" ? source.workbookId : "",
    ready: Boolean(source?.ready),
    tabs: Array.isArray(source?.tabs)
      ? source.tabs.map((tab) => ({
          name: typeof tab?.name === "string" ? tab.name : "unknown_tab",
          exists: Boolean(tab?.exists),
          rowCount: Number(tab?.rowCount ?? 0),
          columnCount: Number(tab?.columnCount ?? 0),
          headers: Array.isArray(tab?.headers) ? tab.headers.map((item) => String(item)) : [],
          missingColumns: Array.isArray(tab?.missingColumns) ? tab.missingColumns.map((item) => String(item)) : []
        }))
      : []
  };
}

function normalizePreviewPayload(payload: unknown): WorkbookPreviewPayload {
  const source = payload as Partial<WorkbookPreviewPayload> | null;

  return {
    workbookName: typeof source?.workbookName === "string" ? source.workbookName : "Chưa rõ tên workbook",
    workbookId: typeof source?.workbookId === "string" ? source.workbookId : "",
    tabs: Array.isArray(source?.tabs)
      ? source.tabs.map((tab) => ({
          name: typeof tab?.name === "string" ? tab.name : "unknown_tab",
          headers: Array.isArray(tab?.headers) ? tab.headers.map((item) => String(item)) : [],
          rowCount: Number(tab?.rowCount ?? 0),
          rows: Array.isArray(tab?.rows)
            ? tab.rows.map((row) =>
                Object.fromEntries(
                  Object.entries((row ?? {}) as Record<string, unknown>).map(([key, value]) => [
                    key,
                    value === undefined ? "" : String(value)
                  ])
                )
              )
            : []
        }))
      : []
  };
}

function formatCellValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function highlightText(value: string, keyword: string) {
  if (!keyword) {
    return value;
  }

  const lowerValue = value.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const matches: Array<{ start: number; end: number }> = [];
  let cursor = 0;

  while (cursor < value.length) {
    const index = lowerValue.indexOf(lowerKeyword, cursor);

    if (index < 0) {
      break;
    }

    matches.push({ start: index, end: index + keyword.length });
    cursor = index + keyword.length;
  }

  if (matches.length === 0) {
    return value;
  }

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  matches.forEach((match, index) => {
    if (match.start > lastEnd) {
      parts.push(<Fragment key={`text-${index}`}>{value.slice(lastEnd, match.start)}</Fragment>);
    }

    parts.push(
      <mark className="cellHighlight" key={`mark-${index}`}>
        {value.slice(match.start, match.end)}
      </mark>
    );
    lastEnd = match.end;
  });

  if (lastEnd < value.length) {
    parts.push(<Fragment key="text-end">{value.slice(lastEnd)}</Fragment>);
  }

  return parts;
}

function getPrimaryCode(row: PreviewRow) {
  const codeFields = ["icd_code", "cls_code", "drug_code", "rule_code", "protocol_code"];

  for (const field of codeFields) {
    const value = row[field];

    if (value) {
      return String(value);
    }
  }

  return null;
}

function getPrimaryKeyField(row: PreviewRow) {
  const codeFields = ["icd_code", "cls_code", "drug_code", "rule_code", "protocol_code"];

  for (const field of codeFields) {
    if (row[field]) {
      return field;
    }
  }

  const firstField = Object.keys(row)[0];
  return firstField ?? null;
}

function buildCatalogHint(parts: Array<string | null | undefined>) {
  return parts
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .join(" • ");
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export default function AdminHome() {
  const [isMounted, setIsMounted] = useState(false);
  const [dragState, setDragState] = useState<{ kind: "cls" | "drug"; dragIndex: number; overIndex: number } | null>(null);
  const [template, setTemplate] = useState<TemplatePayload | null>(null);
  const [inspect, setInspect] = useState<WorkbookInspectPayload | null>(null);
  const [preview, setPreview] = useState<WorkbookPreviewPayload | null>(null);
  const [selectedPreviewTab, setSelectedPreviewTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [status, setStatus] = useState("Sẵn sàng kiểm tra cấu trúc dữ liệu Google Sheets.");
  const [loading, setLoading] = useState<null | "refresh" | "template" | "inspect" | "preview" | "save" | "log">(null);
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});
  const [saveNote, setSaveNote] = useState("");
  const [changeLog, setChangeLog] = useState<ChangeLogPayload | null>(null);
  const [logTabFilter, setLogTabFilter] = useState("all");
  const [logKeyword, setLogKeyword] = useState("");
  const [icdSearchTerm, setIcdSearchTerm] = useState("");
  const [activeIcdCode, setActiveIcdCode] = useState("");
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const [quickCreate, setQuickCreate] = useState<QuickCreateState>(createEmptyQuickCreate);
  const [quickAddCls, setQuickAddCls] = useState({
    name: "",
    group: "Xét nghiệm bổ sung",
    unit: "",
    defaultFrequency: "",
    note: ""
  });
  const [quickAddMedication, setQuickAddMedication] = useState({
    name: "",
    group: "Thuốc bổ sung",
    route: "",
    strength: "",
    note: ""
  });
  const [lastCreatedCatalogEntry, setLastCreatedCatalogEntry] = useState<{
    kind: "cls" | "medication";
    code: string;
    name: string;
  } | null>(null);

  async function loadTemplate() {
    setLoading("template");
    setStatus("Đang lấy mẫu cấu trúc workbook từ Apps Script...");

    try {
      const response = await fetch("/api/google-sheets/template", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? `HTTP ${response.status}`);
      }

      setTemplate(normalizeTemplatePayload(payload));
      setStatus("Đã lấy được mẫu tab kỳ vọng từ Apps Script.");
    } catch (error) {
      setStatus(`Không thể lấy template từ Apps Script. ${(error as Error).message}`);
    } finally {
      setLoading(null);
    }
  }

  async function inspectWorkbook() {
    setLoading("inspect");
    setStatus("Đang kiểm tra cấu trúc workbook Google Sheet...");

    try {
      const response = await fetch("/api/google-sheets/workbook-inspect", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? `HTTP ${response.status}`);
      }

      const normalized = normalizeInspectPayload(payload);
      setInspect(normalized);
      setStatus(
        normalized.ready
          ? "Workbook đã đủ cấu trúc cơ bản cho pilot."
          : "Workbook còn thiếu tab hoặc thiếu cột cần thiết."
      );
    } catch (error) {
      setStatus(`Không thể kiểm tra workbook. ${(error as Error).message}`);
    } finally {
      setLoading(null);
    }
  }

  async function loadPreview() {
    setLoading("preview");
    setStatus("Đang lấy dữ liệu mẫu trực tiếp từ Google Sheet...");

    try {
      const response = await fetch(`/api/google-sheets/workbook-preview?tabs=${previewTabs.join(",")}`, {
        cache: "no-store"
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? `HTTP ${response.status}`);
      }

      setPreview(normalizePreviewPayload(payload));
      setSelectedPreviewTab("all");
      setSelectedRecord(null);
      setEditDraft({});
      setSaveNote("");
      setCopyStatus("");
      setStatus("Đã tải dữ liệu thật từ Google Sheet để rà soát nhanh trong màn quản trị.");
    } catch (error) {
      setStatus(`Không thể lấy dữ liệu thật từ Google Sheet. ${(error as Error).message}`);
    } finally {
      setLoading(null);
    }
  }

  async function copyCode(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`Đã copy mã ${value}.`);
    } catch {
      setCopyStatus(`Không thể copy mã ${value}.`);
    }
  }

  async function loadChangeLog() {
    setLoading("log");
    setStatus("Đang tải lịch sử thay đổi từ Google Sheet...");

    try {
      const response = await fetch("/api/google-sheets/change-log?limit=20", {
        cache: "no-store"
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? `HTTP ${response.status}`);
      }

      setChangeLog({
        total: Number(payload?.total ?? 0),
        rows: Array.isArray(payload?.rows)
          ? payload.rows.map((row: Record<string, unknown>) =>
              Object.fromEntries(
                Object.entries(row ?? {}).map(([key, value]) => [key, value === undefined ? "" : String(value)])
              )
            )
          : []
      });
      setStatus("Đã tải lịch sử thay đổi gần nhất.");
    } catch (error) {
      setStatus(`Không thể tải lịch sử thay đổi. ${(error as Error).message}`);
    } finally {
      setLoading(null);
    }
  }

  async function refreshAll() {
    setLoading("refresh");
    setStatus("Đang làm mới toàn bộ dữ liệu quản trị...");

    try {
      const [templateResponse, inspectResponse, previewResponse, logResponse] = await Promise.all([
        fetch("/api/google-sheets/template", { cache: "no-store" }),
        fetch("/api/google-sheets/workbook-inspect", { cache: "no-store" }),
        fetch(`/api/google-sheets/workbook-preview?tabs=${previewTabs.join(",")}`, { cache: "no-store" }),
        fetch("/api/google-sheets/change-log?limit=20", { cache: "no-store" })
      ]);

      const [templatePayload, inspectPayload, previewPayload, logPayload] = await Promise.all([
        templateResponse.json(),
        inspectResponse.json(),
        previewResponse.json(),
        logResponse.json()
      ]);

      setTemplate(normalizeTemplatePayload(templatePayload));
      setInspect(normalizeInspectPayload(inspectPayload));
      setPreview(normalizePreviewPayload(previewPayload));
      setChangeLog({
        total: Number(logPayload?.total ?? 0),
        rows: Array.isArray(logPayload?.rows)
          ? logPayload.rows.map((row: Record<string, unknown>) =>
              Object.fromEntries(
                Object.entries(row ?? {}).map(([key, value]) => [key, value === undefined ? "" : String(value)])
              )
            )
          : []
      });
      setStatus("Đã làm mới toàn bộ dashboard quản trị.");
    } catch (error) {
      setStatus(`Không thể làm mới dashboard. ${(error as Error).message}`);
    } finally {
      setLoading(null);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  function exportFilteredCsv() {
    if (filteredPreviewTabs.length === 0) {
      setCopyStatus("Không có dữ liệu để xuất CSV.");
      return;
    }

    const lines: string[] = [];

    filteredPreviewTabs.forEach((tab) => {
      lines.push(`# ${tabLabels[tab.name] ?? tab.name}`);
      lines.push(tab.headers.map(escapeCsv).join(","));

      tab.filteredRows.forEach((row) => {
        lines.push(tab.headers.map((header) => escapeCsv(formatCellValue(row[header]))).join(","));
      });

      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const suffix = selectedPreviewTab === "all" ? "tat-ca-tab" : selectedPreviewTab;

    anchor.href = url;
    anchor.download = `app-bhxh-${suffix}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setCopyStatus("Đã xuất CSV theo bộ lọc hiện tại.");
  }

  function openRecord(tabName: string, row: PreviewRow) {
    const normalizedDraft = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, value === null || value === undefined ? "" : String(value)])
    );

    setSelectedRecord({ tabName, row });
    setEditDraft(normalizedDraft);
    setSaveNote("");
  }

  function resetDraft() {
    if (!selectedRecord) {
      return;
    }

    setEditDraft(
      Object.fromEntries(
        Object.entries(selectedRecord.row).map(([key, value]) => [key, value === null || value === undefined ? "" : String(value)])
      )
    );
    setSaveNote("");
  }

  async function saveRecord() {
    if (!selectedRecord) {
      return;
    }

    const keyField = getPrimaryKeyField(selectedRecord.row);
    const keyValue = keyField ? selectedRecord.row[keyField] : null;

    if (!keyField || keyValue === null || keyValue === undefined || keyValue === "") {
      setStatus("Không xác định được khóa chính để cập nhật bản ghi này.");
      return;
    }

    setLoading("save");
    setStatus("Đang lưu thay đổi về Google Sheet...");

    try {
      const response = await fetch("/api/google-sheets/update-record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tabName: selectedRecord.tabName,
          keyField,
          keyValue: String(keyValue),
          updates: editDraft,
          actor: "admin-ui",
          note: saveNote
        })
      });

      const payload = await response.json();

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.message ?? `HTTP ${response.status}`);
      }

      const updatedRow = payload?.updatedRow
        ? Object.fromEntries(
            Object.entries(payload.updatedRow as Record<string, unknown>).map(([key, value]) => [
              key,
              value === undefined ? "" : String(value)
            ])
          )
        : editDraft;

      setPreview((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          tabs: current.tabs.map((tab) => {
            if (tab.name !== selectedRecord.tabName) {
              return tab;
            }

            return {
              ...tab,
              rows: tab.rows.map((row) =>
                String(row[keyField] ?? "") === String(keyValue) ? updatedRow : row
              )
            };
          })
        };
      });

      setSelectedRecord({
        tabName: selectedRecord.tabName,
        row: updatedRow
      });
      setEditDraft(updatedRow);
      setCopyStatus("Đã lưu thay đổi và cập nhật log trên Google Sheet.");
      setStatus(payload?.message ?? "Đã lưu thay đổi thành công.");
    } catch (error) {
      setStatus(`Không thể lưu thay đổi. ${(error as Error).message}`);
    } finally {
      setLoading(null);
    }
  }

  async function createQuickBundle() {
    if (!quickCreate.icdCode.trim() || !quickCreate.icdName.trim()) {
      setStatus("Cần nhập mã ICD và tên ICD trước khi tạo mới.");
      return;
    }

    setLoading("save");
    setStatus("Đang tạo nhanh cấu hình cho ICD mới...");

    try {
      const response = await fetch("/api/google-sheets/create-icd-rule-bundle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...quickCreate,
          clsSelections: quickCreate.clsCodes.map((code, index) => ({
            code,
            note: quickCreate.clsMappingNotes[code] ?? "",
            repeatFrequency: quickCreate.clsRepeatFrequencies[code] ?? "",
            mappingType: "recommended",
            priority: index + 1
          })),
          drugSelections: quickCreate.drugCodes.map((code, index) => ({
            code,
            note: quickCreate.drugMappingNotes[code] ?? "",
            mappingType: "preferred",
            priority: index + 1
          })),
          actor: "admin-ui"
        })
      });
      const payload = await response.json();

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.message ?? `HTTP ${response.status}`);
      }

      setStatus(payload?.message ?? "Đã tạo nhanh cấu hình cho ICD mới.");
      setCopyStatus(`Đã nạp mới ICD ${quickCreate.icdCode}.`);
      setActiveIcdCode(quickCreate.icdCode);
      await refreshAll();
    } catch (error) {
      setStatus(`Không thể tạo nhanh ICD mới. ${(error as Error).message}`);
    } finally {
      setLoading(null);
    }
  }

  async function createCatalogEntry(kind: "cls" | "medication") {
    const payload =
      kind === "cls"
        ? {
            kind,
            ...quickAddCls,
            actor: "admin-ui"
          }
        : {
            kind,
            ...quickAddMedication,
            actor: "admin-ui"
          };

    if (!payload.name.trim()) {
      setStatus(
        kind === "cls"
          ? "Cần nhập tên cho xét nghiệm/thăm dò mới."
          : "Cần nhập tên cho thuốc/nhóm thuốc mới."
      );
      return;
    }

    setLoading("save");
    setStatus(
      kind === "cls"
        ? "Đang thêm xét nghiệm/thăm dò mới vào danh mục..."
        : "Đang thêm thuốc/nhóm thuốc mới vào danh mục..."
    );

    try {
      const response = await fetch("/api/google-sheets/create-catalog-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.message ?? `HTTP ${response.status}`);
      }

      const createdCode = String(data?.code ?? "");

      if (kind === "cls") {
        setQuickCreate((current) => ({
          ...current,
          clsCodes: createdCode && !current.clsCodes.includes(createdCode) ? [...current.clsCodes, createdCode] : current.clsCodes
        }));
        setLastCreatedCatalogEntry({
          kind: "cls",
          code: createdCode,
          name: String(data?.name ?? payload.name)
        });
        setQuickAddCls({
          name: "",
          group: "Xét nghiệm bổ sung",
          unit: "",
          defaultFrequency: "",
          note: ""
        });
      } else {
        setQuickCreate((current) => ({
          ...current,
          drugCodes:
            createdCode && !current.drugCodes.includes(createdCode) ? [...current.drugCodes, createdCode] : current.drugCodes
        }));
        setLastCreatedCatalogEntry({
          kind: "medication",
          code: createdCode,
          name: String(data?.name ?? payload.name)
        });
        setQuickAddMedication({
          name: "",
          group: "Thuốc bổ sung",
          route: "",
          strength: "",
          note: ""
        });
      }

      setCopyStatus(
        kind === "cls"
          ? `Đã thêm và chọn ngay xét nghiệm ${createdCode || data?.name}.`
          : `Đã thêm và chọn ngay thuốc ${createdCode || data?.name}.`
      );
      await refreshAll();
    } catch (error) {
      setStatus(
        `${kind === "cls" ? "Không thể thêm xét nghiệm/thăm dò mới" : "Không thể thêm thuốc/nhóm thuốc mới"}. ${
          (error as Error).message
        }`
      );
    } finally {
      setLoading(null);
    }
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const normalizedLogKeyword = logKeyword.trim().toLowerCase();

  const filteredPreviewTabs = useMemo(() => {
    return (preview?.tabs ?? [])
      .filter((tab) => selectedPreviewTab === "all" || tab.name === selectedPreviewTab)
      .map((tab) => {
        const filteredRows = normalizedSearchTerm
          ? tab.rows.filter((row) =>
              tab.headers.some((header) => String(row[header] ?? "").toLowerCase().includes(normalizedSearchTerm))
            )
          : tab.rows;

        return {
          ...tab,
          filteredRows
        };
      })
      .filter((tab) => normalizedSearchTerm === "" || tab.filteredRows.length > 0);
  }, [normalizedSearchTerm, preview, selectedPreviewTab]);

  const filteredChangeLogRows = useMemo(() => {
    return (changeLog?.rows ?? []).filter((row) => {
      const tabMatched = logTabFilter === "all" || String(row.tab_name ?? "") === logTabFilter;
      const keywordMatched =
        normalizedLogKeyword === "" ||
        Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(normalizedLogKeyword));

      return tabMatched && keywordMatched;
    });
  }, [changeLog?.rows, logTabFilter, normalizedLogKeyword]);

  const totalPreviewRows = (preview?.tabs ?? []).reduce((sum, tab) => sum + tab.rowCount, 0);
  const latestChangedTab = filteredChangeLogRows[0]?.tab_name ? String(filteredChangeLogRows[0].tab_name) : "Chưa có log";

  const clsCatalogRows = (preview?.tabs ?? []).find((tab) => tab.name === "catalog_cls")?.rows ?? [];
  const medicationCatalogRows = (preview?.tabs ?? []).find((tab) => tab.name === "catalog_medication")?.rows ?? [];
  const icdCatalogRows = (preview?.tabs ?? []).find((tab) => tab.name === "catalog_icd")?.rows ?? [];
  const icdClsMappingRows = (preview?.tabs ?? []).find((tab) => tab.name === "mapping_icd_cls")?.rows ?? [];
  const icdMedicationMappingRows =
    (preview?.tabs ?? []).find((tab) => tab.name === "mapping_icd_medication")?.rows ?? [];
  const claimRiskRows = (preview?.tabs ?? []).find((tab) => tab.name === "rule_claim_risk")?.rows ?? [];
  const protocolHeaderRows = (preview?.tabs ?? []).find((tab) => tab.name === "protocol_header")?.rows ?? [];
  const costCompositionRows =
    (preview?.tabs ?? []).find((tab) => tab.name === "rule_cost_composition")?.rows ?? [];
  const selectedClsLabels = clsCatalogRows
    .filter((row) => quickCreate.clsCodes.includes(String(row.cls_code ?? "")))
    .map((row) => String(row.cls_name ?? row.cls_code ?? ""))
    .filter(Boolean);
  const selectedDrugLabels = medicationCatalogRows
    .filter((row) => quickCreate.drugCodes.includes(String(row.drug_code ?? "")))
    .map((row) => String(row.drug_name ?? row.drug_code ?? ""))
    .filter(Boolean);
  const selectedClsDetails: MappingDetailItem[] = quickCreate.clsCodes.map((code) => {
    const row = clsCatalogRows.find((item) => String(item.cls_code ?? "") === code);

    return {
      code,
      name: String(row?.cls_name ?? code),
      group: String(row?.cls_group ?? ""),
      catalogHint: buildCatalogHint([String(row?.unit ?? ""), String(row?.default_frequency ?? "")]),
      note: quickCreate.clsMappingNotes[code] ?? ""
    };
  });
  const selectedDrugDetails: MappingDetailItem[] = quickCreate.drugCodes.map((code) => {
    const row = medicationCatalogRows.find((item) => String(item.drug_code ?? "") === code);

    return {
      code,
      name: String(row?.drug_name ?? code),
      group: String(row?.drug_group ?? ""),
      catalogHint: buildCatalogHint([String(row?.route ?? ""), String(row?.strength ?? "")]),
      note: quickCreate.drugMappingNotes[code] ?? ""
    };
  });
  const configuredIcdRows = useMemo(() => {
    const mappedClsCodes = new Set(icdClsMappingRows.map((row) => String(row.icd_code ?? "")));
    const mappedDrugCodes = new Set(icdMedicationMappingRows.map((row) => String(row.icd_code ?? "")));
    const ruledCodes = new Set(claimRiskRows.map((row) => String(row.applies_to_icd ?? "")));

    return icdCatalogRows
      .filter((row) => {
        const code = String(row.icd_code ?? "");
        return code && (mappedClsCodes.has(code) || mappedDrugCodes.has(code) || ruledCodes.has(code));
      })
      .map((row) => {
        const code = String(row.icd_code ?? "");
        const ruleRow = claimRiskRows.find((item) => String(item.applies_to_icd ?? "") === code);
        const profile = parseRuleProfile(ruleRow?.condition_expression);
        const clsCount = icdClsMappingRows.filter((item) => String(item.icd_code ?? "") === code).length;
        const drugCount = icdMedicationMappingRows.filter((item) => String(item.icd_code ?? "") === code).length;
        const completeness = [
          clsCount > 0,
          drugCount > 0,
          Boolean(String(ruleRow?.warning_message ?? "").trim()),
          Boolean(String(profile.labPurposeNote ?? "").trim() || String(profile.medicationRoleNote ?? "").trim())
        ].filter(Boolean).length;

        return {
          code,
          name: String(row.icd_name ?? ""),
          chapter: String(row.chapter ?? ""),
          clsCount,
          drugCount,
          hasWarning: Boolean(String(ruleRow?.warning_message ?? "").trim()),
          hasGroupNotes: Boolean(
            String(profile.labPurposeNote ?? "").trim() || String(profile.medicationRoleNote ?? "").trim()
          ),
          completeness,
          missingItems: [
            clsCount > 0 ? null : "thiếu CLS",
            drugCount > 0 ? null : "thiếu thuốc",
            String(ruleRow?.warning_message ?? "").trim() ? null : "thiếu cảnh báo",
            String(profile.labPurposeNote ?? "").trim() || String(profile.medicationRoleNote ?? "").trim()
              ? null
              : "thiếu ghi chú nhóm"
          ].filter(Boolean) as string[]
        };
      })
      .sort((left, right) => left.code.localeCompare(right.code));
  }, [claimRiskRows, icdCatalogRows, icdClsMappingRows, icdMedicationMappingRows]);
  const configuredCostProfiles = useMemo(() => {
    return configuredIcdRows
      .map((row) => {
        const costRuleRow = costCompositionRows.find(
          (item) => String(item.scope_type ?? "").toLowerCase() === "icd" && String(item.scope_code ?? "") === row.code
        );

        if (!costRuleRow) {
          return null;
        }

        return {
          code: row.code,
          name: row.name,
          icdRatio: String(costRuleRow.icd_ratio_max ?? ""),
          clsRatio: String(costRuleRow.cls_ratio_max ?? ""),
          drugRatio: String(costRuleRow.drug_ratio_max ?? "")
        };
      })
      .filter(Boolean) as Array<{
      code: string;
      name: string;
      icdRatio: string;
      clsRatio: string;
      drugRatio: string;
    }>;
  }, [configuredIcdRows, costCompositionRows]);
  const filteredConfiguredIcdRows = useMemo(() => {
    const normalizedKeyword = icdSearchTerm.trim().toLowerCase();

    if (!normalizedKeyword) {
      return [];
    }

    return configuredIcdRows.filter(
      (row) => row.code.toLowerCase().includes(normalizedKeyword) || row.name.toLowerCase().includes(normalizedKeyword)
    );
  }, [configuredIcdRows, icdSearchTerm]);
  const activeCostTotal =
    Number.parseInt(quickCreate.icdRatioMax || "0", 10) +
    Number.parseInt(quickCreate.clsRatioMax || "0", 10) +
    Number.parseInt(quickCreate.drugRatioMax || "0", 10);
  const costSuggestions = useMemo(() => {
    const suggestions: CostSuggestionItem[] = [];
    const seen = new Set<string>();
    const preset = getPresetCostSuggestion(quickCreate.icdCode, quickCreate.icdName);

    suggestions.push(preset);
    seen.add(preset.key);

    configuredCostProfiles
      .filter((item) => item.code !== activeIcdCode && item.code !== quickCreate.icdCode.trim().toUpperCase())
      .slice(0, 4)
      .forEach((item) => {
        const key = `reference-${item.code}`;

        if (seen.has(key)) {
          return;
        }

        suggestions.push({
          key,
          title: `${item.code} - ${item.name || "ICD đã cấu hình"}`,
          description: "Tham chiếu từ ICD đã có cấu hình cơ cấu chi phí trong hệ thống.",
          icdRatio: item.icdRatio,
          clsRatio: item.clsRatio,
          drugRatio: item.drugRatio,
          tone: "reference"
        });
        seen.add(key);
      });

    if (suggestions.length === 1) {
      suggestions.push({
        key: "reference-default-balance",
        title: "Mẫu cân bằng ICD + CLS + thuốc",
        description: "Điểm khởi đầu an toàn khi chưa có ICD tương tự để đối chiếu.",
        icdRatio: "35",
        clsRatio: "30",
        drugRatio: "35",
        tone: "default"
      });
    }

    return suggestions;
  }, [activeIcdCode, configuredCostProfiles, quickCreate.icdCode, quickCreate.icdName]);
  const summaryCards = [
    {
      label: "ICD đã tạo",
      value: String(configuredIcdRows.length),
      note: "Tổng số hồ sơ bệnh đã được thiết lập"
    },
    {
      label: "Dòng dữ liệu pilot",
      value: preview ? String(totalPreviewRows) : "—",
      note: "Tổng dòng ở các tab trọng tâm"
    },
    {
      label: "Lịch sử thay đổi",
      value: changeLog ? String(changeLog.total) : "—",
      note: "Số bản ghi log đang theo dõi"
    },
    {
      label: "Tab đổi gần nhất",
      value: latestChangedTab,
      note: "Lấy từ lịch sử thay đổi gần đây"
    }
  ];

  function applyCostSuggestion(suggestion: CostSuggestionItem) {
    setQuickCreate((current) => ({
      ...current,
      icdRatioMax: suggestion.icdRatio,
      clsRatioMax: suggestion.clsRatio,
      drugRatioMax: suggestion.drugRatio
    }));
    setStatus(`Đã áp dụng gợi ý cơ cấu chi phí: ICD ${suggestion.icdRatio}% - CLS ${suggestion.clsRatio}% - Thuốc ${suggestion.drugRatio}%.`);
  }

  function loadIcdIntoForm(icdCode: string) {
    const catalogRow = icdCatalogRows.find((row) => String(row.icd_code ?? "") === icdCode);
    const ruleRow = claimRiskRows.find((row) => String(row.applies_to_icd ?? "") === icdCode);
    const protocolHeaderRow = protocolHeaderRows.find(
      (row) => String(row.protocol_code ?? "").toUpperCase().endsWith(icdCode.replace(/\./g, "").toUpperCase())
    );
    const costRuleRow = costCompositionRows.find(
      (row) => String(row.scope_type ?? "").toLowerCase() === "icd" && String(row.scope_code ?? "") === icdCode
    );
    const profile = parseRuleProfile(ruleRow?.condition_expression);
    const clsMappings = icdClsMappingRows
      .filter((row) => String(row.icd_code ?? "") === icdCode)
      .sort((left, right) => Number(left.priority ?? 0) - Number(right.priority ?? 0));
    const drugMappings = icdMedicationMappingRows
      .filter((row) => String(row.icd_code ?? "") === icdCode)
      .sort((left, right) => Number(left.priority ?? 0) - Number(right.priority ?? 0));
    const clsCodes = clsMappings.map((row) => String(row.cls_code ?? "")).filter(Boolean);
    const drugCodes = drugMappings.map((row) => String(row.drug_code ?? "")).filter(Boolean);
    const clsMappingNotes = Object.fromEntries(
      clsMappings.map((row) => [String(row.cls_code ?? ""), String(row.note ?? "")])
    );
    const clsRepeatFrequencies = Object.fromEntries(
      clsMappings.map((row) => [String(row.cls_code ?? ""), String(row.repeat_frequency ?? "")])
    );
    const drugMappingNotes = Object.fromEntries(
      drugMappings.map((row) => [String(row.drug_code ?? ""), String(row.note ?? "")])
    );

    setQuickCreate({
      ...createEmptyQuickCreate(),
      icdCode,
      icdName: String(catalogRow?.icd_name ?? ""),
      chapter: String(catalogRow?.chapter ?? "Nội khoa"),
      protocolName: String(protocolHeaderRow?.protocol_name ?? ""),
      protocolStatus: String(protocolHeaderRow?.status ?? "active"),
      protocolOwner: String(protocolHeaderRow?.owner_name ?? "Phòng khám"),
      primaryRuleSet: String(profile.primaryRuleSet ?? "claim-basic"),
      rulePriorityLevel: String(profile.rulePriorityLevel ?? "high"),
      ruleFocus: String(profile.ruleFocus ?? "Cảnh báo trước xuất toán"),
      ruleIsActive: profile.ruleIsActive !== undefined ? Boolean(profile.ruleIsActive) : true,
      severity: String(ruleRow?.severity ?? "medium"),
      warningMessage: String(ruleRow?.warning_message ?? ""),
      recommendedAction: String(ruleRow?.recommended_action ?? ""),
      description: String(profile.description ?? ""),
      careSetting: String(profile.careSetting ?? "Ngoại trú"),
      ageGroup: String(profile.ageGroup ?? "Người lớn"),
      visitContext: String(profile.visitContext ?? "Khám mới hoặc tái khám"),
      triggerSymptoms: String(profile.triggerSymptoms ?? ""),
      contraindications: String(profile.contraindications ?? ""),
      labPurposeNote: String(profile.labPurposeNote ?? ""),
      medicationRoleNote: String(profile.medicationRoleNote ?? ""),
      reimbursementNote: String(profile.reimbursementNote ?? ""),
      systemSupportNote: String(profile.systemSupportNote ?? ""),
      note: String(profile.note ?? ""),
      icdRatioMax: String(costRuleRow?.icd_ratio_max ?? "30"),
      clsRatioMax: String(costRuleRow?.cls_ratio_max ?? "40"),
      drugRatioMax: String(costRuleRow?.drug_ratio_max ?? "30"),
      clsCodes,
      drugCodes,
      clsMappingNotes,
      drugMappingNotes,
      clsRepeatFrequencies
    });
    setActiveIcdCode(icdCode);
    setStatus(`Đã nạp lại cấu hình hiện có của ICD ${icdCode} để tiếp tục điều chỉnh.`);
  }

  useEffect(() => {
    const normalizedCode = quickCreate.icdCode.trim().toUpperCase();

    if (!normalizedCode || normalizedCode === activeIcdCode) {
      return;
    }

    const existingIcd = configuredIcdRows.find((row) => row.code === normalizedCode);

    if (existingIcd) {
      loadIcdIntoForm(normalizedCode);
    }
  }, [activeIcdCode, configuredIcdRows, quickCreate.icdCode]);

  return (
    <div className="adminShell">
      <aside className="adminRail">
        <div className="brand fade-1">
          <span className="eyebrow">Hệ thống quản trị</span>
          <h1>CDS Dashboard Admin</h1>
          <p>Quản trị Tri thức & Giao thức BHYT (Google Sheets centric)</p>
        </div>

        <nav className="navCluster">
          <div className="navItem" onClick={() => void window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <strong>Bảng điều khiển</strong>
            <span>Dashboard Home</span>
          </div>
          <div className="navItem" onClick={() => document.querySelector('.configuredIcdList')?.scrollIntoView({ behavior: 'smooth' })}>
            <strong>Tra cứu ICD</strong>
            <span>Search & Edit</span>
          </div>
        </nav>

        <section className="surface statusPanel">
          <div className="surfaceHeader">
            <span className="eyebrow">HỆ THỐNG</span>
          </div>
          <p className="statusText">{status}</p>
          <div className="systemMeta">
            <span className="tag">GAS Active</span>
            <span className="tag">Pilot v1.2</span>
          </div>
        </section>
      </aside>

      <main className="adminContent fade-up">
        <header className="hero">
          <div className="heroContent">
            <span className="eyebrow">WORKSPACE</span>
            <h2>Điều hành Pilot & Quy tắc BHYT</h2>
          </div>
          <div className="heroActions">
            <button className="adminButton small" onClick={() => void refreshAll()}>Sync Sheets</button>
            <button className="adminButton small secondary" onClick={() => void loadPreview()}>Data Audit</button>
          </div>
        </header>

        <section className="surface commandBar">
          <div className="adminActions">
            <button className="iconButton" title="Test Apps Script" onClick={() => void loadTemplate()}>
              <span>Test GAS</span>
            </button>
            <button className="iconButton" title="Kiểm tra workbook" onClick={() => void inspectWorkbook()}>
              <span>Inspect Workbook</span>
            </button>
            <button className="iconButton" title="Tải lịch sử thay đổi" onClick={() => void loadChangeLog()}>
              <span>Changelog</span>
            </button>
          </div>
          {copyStatus ? <p className="copyStatus">{copyStatus}</p> : null}
        </section>

        <section className="overviewGrid fade-up">
          <article className="overviewCard">
            <span>Mức sẵn sàng Workbook</span>
            <strong>{inspect?.ready ? "100%" : "85%"}</strong>
            <small>{inspect?.ready ? "Đã đủ các tab và cột tối thiểu." : "Cần bổ sung thêm cột hoặc tab."}</small>
          </article>
          <article className="overviewCard">
            <span>Độ phủ Giao thức</span>
            <strong>68%</strong>
            <small>Dựa trên 2 phác đồ mẫu Bộ Y tế.</small>
          </article>
          <article className="overviewCard">
            <span>Quy tắc BHYT</span>
            <strong>{preview?.tabs.find(t => t.name === 'rule_claim_risk')?.rowCount || 0}</strong>
            <small>Các quy tắc chặn/cảnh báo đang kích hoạt.</small>
          </article>
          <article className="overviewCard">
            <span>Sync gần nhất</span>
            <strong>{isMounted ? new Date().toLocaleTimeString() : "--:--:--"}</strong>
            <small>Dữ liệu đồng bộ từ Google Sheets.</small>
          </article>
        </section>

        <section className="surface fade-3">
          <div className="surfaceHeader">
            <h3>Danh sách ICD đã cấu hình</h3>
            <span>{configuredIcdRows.length} ICD đã setup</span>
          </div>
          <div className="configuredIcdTools">
            <label className="controlField">
              <span>Tìm theo mã ICD hoặc tên bệnh</span>
              <input
                placeholder="Ví dụ: I10, E11.9, tăng huyết áp..."
                value={icdSearchTerm}
                onChange={(event) => setIcdSearchTerm(event.target.value)}
              />
            </label>
            <div className="selectorSummary">
              {icdSearchTerm.trim() === ""
                ? "Nhập mã ICD hoặc tên bệnh để gọi lại hồ sơ đã có."
                : filteredConfiguredIcdRows.length > 0
                ? `Đang hiển thị ${filteredConfiguredIcdRows.length} hồ sơ bệnh đã cấu hình.`
                : "Chưa có ICD nào khớp với từ khóa tìm kiếm."}
            </div>
          </div>
          {icdSearchTerm.trim() !== "" ? (
            <div className="configuredIcdList">
              {filteredConfiguredIcdRows.map((row) => (
                <button
                  className={`configuredIcdItem${activeIcdCode === row.code ? " selected" : ""}`}
                  key={row.code}
                  onClick={() => loadIcdIntoForm(row.code)}
                  type="button"
                >
                  <strong>{row.name || row.code}</strong>
                  <span>{row.code}</span>
                  <small>{row.chapter || "Chưa phân nhóm chuyên môn"}</small>
                  <div className="configuredIcdStats">
                    <small>{row.clsCount} CLS</small>
                    <small>{row.drugCount} thuốc</small>
                    <small>{row.hasWarning ? "Có cảnh báo" : "Chưa có cảnh báo"}</small>
                  </div>
                  <div className="configuredIcdHealth">
                    <span className={`healthPill${row.clsCount > 0 ? " ready" : ""}`}>CLS</span>
                    <span className={`healthPill${row.drugCount > 0 ? " ready" : ""}`}>Thuốc</span>
                    <span className={`healthPill${row.hasWarning ? " ready" : ""}`}>Cảnh báo</span>
                    <span className={`healthPill${row.hasGroupNotes ? " ready" : ""}`}>Ghi chú nhóm</span>
                  </div>
                  <div className="configuredIcdFooter">
                    <strong>Độ đầy đủ: {row.completeness}/4</strong>
                    <small>
                      {row.missingItems.length > 0 ? `Còn ${row.missingItems.join(", ")}` : "Đã có đủ các phần cốt lõi"}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="collapsedHint">Danh sách ICD sẽ hiện khi bạn bắt đầu tìm kiếm.</div>
          )}
        </section>

        <section className="surface fade-3">
          <div className="surfaceHeader">
            <h3>Phiếu cấu hình bệnh mới</h3>
            <span>
              {activeIcdCode ? `Đang mở hồ sơ ${activeIcdCode} để chỉnh sửa / bổ sung` : "Nhập theo chuyên môn, hệ thống tự sắp xếp dữ liệu nền"}
            </span>
          </div>

          <div className="intakeIntro">
            <strong>Admin chỉ cần làm việc theo 2 lớp thông tin chuyên môn.</strong>
            <p>
              1. Danh mục nền dùng chung: xét nghiệm hoặc thuốc nào đã tồn tại để nhiều ICD cùng dùng. 2. Thiết lập
              riêng cho ICD đang mở: với bệnh này, mục nào cần gắn vào và ghi chú gì riêng cho từng mục.
            </p>
          </div>

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
                    setQuickCreate((current) => ({ ...current, icdCode: nextCode }));

                    if (nextCode !== activeIcdCode) {
                      setActiveIcdCode("");
                    }
                  }}
                />
              </label>

              <label className="controlField">
                <span>Tên bệnh / chẩn đoán</span>
                <input
                  placeholder="Ví dụ: Viêm phế quản cấp, không xác định"
                  value={quickCreate.icdName}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, icdName: event.target.value }))}
                />
              </label>

              <label className="controlField">
                <span>Nhóm chuyên môn</span>
                <input
                  placeholder="Ví dụ: Nội khoa hô hấp"
                  value={quickCreate.chapter}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, chapter: event.target.value }))}
                />
              </label>

              <label className="controlField">
                <span>Mức cần lưu ý</span>
                <select
                  value={quickCreate.severity}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, severity: event.target.value }))}
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
                  onChange={(event) => setQuickCreate((current) => ({ ...current, description: event.target.value }))}
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
                  onChange={(event) => setQuickCreate((current) => ({ ...current, careSetting: event.target.value }))}
                />
              </label>
              <label className="controlField">
                <span>Nhóm tuổi</span>
                <input
                  placeholder="Ví dụ: Người lớn"
                  value={quickCreate.ageGroup}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, ageGroup: event.target.value }))}
                />
              </label>
              <label className="controlField">
                <span>Bối cảnh khám</span>
                <input
                  placeholder="Ví dụ: Khám mới, tái khám ổn định"
                  value={quickCreate.visitContext}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, visitContext: event.target.value }))}
                />
              </label>
              <label className="controlField">
                <span>Dấu hiệu / triệu chứng cần lưu ý</span>
                <input
                  placeholder="Ví dụ: Sốt kéo dài, ran phổi, khó thở"
                  value={quickCreate.triggerSymptoms}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, triggerSymptoms: event.target.value }))}
                />
              </label>
            </div>
            <div className="quickCreateGrid singleColumn">
              <label className="controlField">
                <span>Tình huống cần tránh hoặc chống chỉ định</span>
                <textarea
                  placeholder="Ví dụ: Không áp dụng gợi ý ngoại trú nếu SpO2 giảm, nghi viêm phổi nặng hoặc có bệnh nền mất bù."
                  value={quickCreate.contraindications}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, contraindications: event.target.value }))}
                />
              </label>
            </div>
          </div>

          <div className="quickCreateSelectors">
            <div className="selectorCard">
              <strong>Xét nghiệm / thăm dò thường cân nhắc</strong>
              <p className="selectorHelp">
                Chọn từ danh mục nền dùng chung. Nếu danh mục chưa có mục phù hợp, thêm mới vào danh mục trước rồi gắn
                vào ICD đang mở.
              </p>
              <div className="selectorSummary">
                {quickCreate.clsCodes.length > 0
                  ? `Đã chọn ${quickCreate.clsCodes.length} mục: ${selectedClsLabels.join(", ")}`
                  : "Chưa chọn mục nào. Có thể bỏ trống nếu chưa muốn gợi ý ở bước này."}
              </div>
              <div className="mappingGuide">
                <div>
                  <strong>Lớp 1. Danh mục nền dùng chung</strong>
                  <span>Một mục chỉ tạo một lần, lưu vào danh mục cận lâm sàng chung của hệ thống.</span>
                </div>
                <div>
                  <strong>Lớp 2. Thiết lập riêng cho ICD</strong>
                  <span>Sau khi chọn mục, bổ sung ghi chú riêng cho bệnh này ở phần bên dưới.</span>
                </div>
              </div>
              <div className="chipList">
                {clsCatalogRows.map((row) => {
                  const code = String(row.cls_code ?? "");
                  const name = String(row.cls_name ?? "");
                  const selected = quickCreate.clsCodes.includes(code);

                  return (
                    <button
                      className={`chipButton${selected ? " selected" : ""}`}
                      key={code}
                      onClick={() =>
                        setQuickCreate((current) => ({
                          ...current,
                          clsCodes: selected
                            ? current.clsCodes.filter((item) => item !== code)
                            : [...current.clsCodes, code],
                          clsMappingNotes: selected
                            ? Object.fromEntries(Object.entries(current.clsMappingNotes).filter(([key]) => key !== code))
                            : current.clsMappingNotes,
                          clsRepeatFrequencies: selected
                            ? Object.fromEntries(Object.entries(current.clsRepeatFrequencies).filter(([key]) => key !== code))
                            : current.clsRepeatFrequencies
                        }))
                      }
                      title={selected ? "Nhấp để bỏ chọn" : "Nhấp để chọn"}
                      type="button"
                    >
                      <div className="chipHeader">
                        <span>{name || code}</span>
                        {selected && <span className="checkMark">✓</span>}
                      </div>
                      <small>{code}</small>
                    </button>
                  );
                })}
              </div>
              {quickCreate.clsCodes.length > 0 && (
                <div className="priorityOrderBox">
                  <div className="priorityOrderHeader">
                    <strong>Thứ tự ưu tiên ({quickCreate.clsCodes.length} mục)</strong>
                    <span>Kéo thả để thay đổi • Nhấp ✕ để bỏ chọn</span>
                  </div>
                  <div className="priorityList">
                    {quickCreate.clsCodes.map((code, index) => {
                      const row = clsCatalogRows.find(r => String(r.cls_code ?? "") === code);
                      const name = row ? String(row.cls_name ?? "") : code;
                      const isDragging = dragState?.kind === "cls" && dragState.dragIndex === index;
                      const isOver = dragState?.kind === "cls" && dragState.overIndex === index;
                      return (
                        <div
                          className={`priorityItem${isDragging ? " dragging" : ""}${isOver ? " dragOver" : ""}`}
                          draggable
                          key={code}
                          onDragEnd={() => {
                            if (dragState && dragState.kind === "cls" && dragState.overIndex !== dragState.dragIndex) {
                              setQuickCreate(cur => {
                                const next = [...cur.clsCodes];
                                const [moved] = next.splice(dragState.dragIndex, 1);
                                next.splice(dragState.overIndex, 0, moved);
                                return { ...cur, clsCodes: next };
                              });
                            }
                            setDragState(null);
                          }}
                          onDragOver={(e) => { e.preventDefault(); setDragState(s => s ? { ...s, overIndex: index } : s); }}
                          onDragStart={() => setDragState({ kind: "cls", dragIndex: index, overIndex: index })}
                        >
                          <span className="dragHandle">⠿</span>
                          <span className="priorityIndex">{index + 1}</span>
                          <span className="priorityName">{name}</span>
                          <small className="priorityCode">{code}</small>
                          <button
                            className="priorityRemove"
                            onClick={() => setQuickCreate(cur => ({
                              ...cur,
                              clsCodes: cur.clsCodes.filter(c => c !== code),
                              clsMappingNotes: Object.fromEntries(Object.entries(cur.clsMappingNotes).filter(([k]) => k !== code)),
                              clsRepeatFrequencies: Object.fromEntries(Object.entries(cur.clsRepeatFrequencies).filter(([k]) => k !== code))
                            }))}
                            title="Bỏ chọn"
                            type="button"
                          >✕</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <label className="controlField">
                <span>Ghi chú chuyên môn cho nhóm CLS</span>
                <textarea
                  placeholder="Ví dụ: Ưu tiên xét nghiệm cơ bản trước, chỉ thêm CLS hình ảnh khi có triệu chứng hô hấp kéo dài hoặc nghi biến chứng."
                  value={quickCreate.labPurposeNote}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, labPurposeNote: event.target.value }))}
                />
              </label>
              <div className="mappingDetailsBox">
                <div className="inlineCreateHeader">
                  <strong>Thiết lập riêng cho từng xét nghiệm trong ICD này</strong>
                  <span>Phần này sẽ lưu vào mapping ICD - CLS, không làm thay đổi danh mục nền dùng chung.</span>
                </div>
                {selectedClsDetails.length > 0 ? (
                  <div className="mappingDetailsList">
                    {selectedClsDetails.map((item) => (
                      <label className="mappingDetailCard" key={`cls-${item.code}`}>
                        <div className="mappingDetailHeader">
                          <strong>{item.name}</strong>
                          <span>{item.group || item.code}</span>
                        </div>
                        {item.catalogHint ? <small className="mappingCatalogHint">Thông tin đang có trong danh mục nền: {item.catalogHint}</small> : null}
                        <textarea
                          placeholder="Ví dụ: cân nhắc khi nghi nguyên nhân nội tiết, trước điều trị toàn thân, hoặc khi cần theo dõi đặc biệt."
                          value={item.note}
                          onChange={(event) =>
                            setQuickCreate((current) => ({
                              ...current,
                              clsMappingNotes: {
                                ...current.clsMappingNotes,
                                [item.code]: event.target.value
                              }
                            }))
                          }
                        />
                        {quickCreate.primaryRuleSet === "repeat-frequency" && (
                          <label className="controlField" style={{ marginTop: '8px' }}>
                            <span>Tần suất cho phép lặp lại (ví dụ: 90 ngày, 3 tháng)</span>
                            <input
                              placeholder="Nhập khoảng thời gian chặn lặp lại..."
                              value={quickCreate.clsRepeatFrequencies?.[item.code] || ""}
                              onChange={(event) =>
                                setQuickCreate((current) => ({
                                  ...current,
                                  clsRepeatFrequencies: {
                                    ...current.clsRepeatFrequencies,
                                    [item.code]: event.target.value
                                  }
                                }))
                              }
                            />
                          </label>
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="emptyMappingState">Chọn ít nhất 1 xét nghiệm để nhập ghi chú riêng cho ICD này.</div>
                )}
              </div>
              <div className="inlineCreateBox">
                <div className="inlineCreateHeader">
                  <strong>Thêm mới vào danh mục cận lâm sàng chung</strong>
                  <span>Mục thêm ở đây sẽ đi vào tab `catalog_cls`, sau đó tự được chọn ngay cho ICD đang mở.</span>
                </div>
                <div className="quickCreateGrid">
                  <label className="controlField">
                    <span>Tên hiển thị</span>
                    <input
                      placeholder="Ví dụ: X-quang phổi thẳng"
                      value={quickAddCls.name}
                      onChange={(event) => setQuickAddCls((current) => ({ ...current, name: event.target.value }))}
                    />
                  </label>
                  <label className="controlField">
                    <span>Nhóm chuyên môn</span>
                    <input
                      placeholder="Ví dụ: Chẩn đoán hình ảnh"
                      value={quickAddCls.group}
                      onChange={(event) => setQuickAddCls((current) => ({ ...current, group: event.target.value }))}
                    />
                  </label>
                  <label className="controlField">
                    <span>Thông tin nền của mục này</span>
                    <input
                      placeholder="Ví dụ: lần khám đầu, theo dõi mỗi đợt điều trị"
                      value={quickAddCls.defaultFrequency}
                      onChange={(event) =>
                        setQuickAddCls((current) => ({ ...current, defaultFrequency: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <div className="detailActions compactActions">
                  <button
                    className="adminButton secondary"
                    disabled={loading !== null}
                    onClick={() => void createCatalogEntry("cls")}
                    type="button"
                  >
                    {loading === "save" ? "Đang lưu..." : "+ Thêm xét nghiệm mới"}
                  </button>
                </div>
                {lastCreatedCatalogEntry?.kind === "cls" ? (
                  <div className="generatedCodeNote">
                    <strong>Đã tạo mục mới:</strong>
                    <span>{lastCreatedCatalogEntry.name}</span>
                    <small>Mục này đã vào danh mục cận lâm sàng chung. Mã hệ thống: {lastCreatedCatalogEntry.code}</small>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="selectorCard">
              <strong>Thuốc / nhóm thuốc thường cân nhắc</strong>
              <p className="selectorHelp">
                Chọn từ danh mục thuốc dùng chung. Nếu danh mục chưa có mục phù hợp, thêm mới vào danh mục trước rồi
                gắn vào ICD đang mở.
              </p>
              <div className="selectorSummary">
                {quickCreate.drugCodes.length > 0
                  ? `Đã chọn ${quickCreate.drugCodes.length} mục: ${selectedDrugLabels.join(", ")}`
                  : "Chưa chọn mục nào. Có thể bổ sung sau khi chuẩn hóa phác đồ."}
              </div>
              <div className="mappingGuide">
                <div>
                  <strong>Lớp 1. Danh mục thuốc dùng chung</strong>
                  <span>Một thuốc hoặc nhóm thuốc chỉ tạo một lần, dùng lại cho nhiều ICD.</span>
                </div>
                <div>
                  <strong>Lớp 2. Thiết lập riêng cho ICD</strong>
                  <span>Sau khi chọn thuốc, nhập thông tin riêng cho bệnh này ở phần bên dưới.</span>
                </div>
              </div>
              <div className="chipList">
                {medicationCatalogRows.map((row) => {
                  const code = String(row.drug_code ?? "");
                  const name = String(row.drug_name ?? "");
                  const selected = quickCreate.drugCodes.includes(code);

                  return (
                    <button
                      className={`chipButton${selected ? " selected" : ""}`}
                      key={code}
                      onClick={() =>
                        setQuickCreate((current) => ({
                          ...current,
                          drugCodes: selected
                            ? current.drugCodes.filter((item) => item !== code)
                            : [...current.drugCodes, code],
                          drugMappingNotes: selected
                            ? Object.fromEntries(Object.entries(current.drugMappingNotes).filter(([key]) => key !== code))
                            : current.drugMappingNotes
                        }))
                      }
                      title={selected ? "Nhấp để bỏ chọn" : "Nhấp để chọn"}
                      type="button"
                    >
                      <div className="chipHeader">
                        <span>{name || code}</span>
                        {selected && <span className="checkMark">✓</span>}
                      </div>
                      <small>{code}</small>
                    </button>
                  );
                })}
              </div>
              {quickCreate.drugCodes.length > 0 && (
                <div className="priorityOrderBox">
                  <div className="priorityOrderHeader">
                    <strong>Thứ tự ưu tiên ({quickCreate.drugCodes.length} mục)</strong>
                    <span>Kéo thả để thay đổi • Nhấp ✕ để bỏ chọn</span>
                  </div>
                  <div className="priorityList">
                    {quickCreate.drugCodes.map((code, index) => {
                      const row = medicationCatalogRows.find(r => String(r.drug_code ?? "") === code);
                      const name = row ? String(row.drug_name ?? "") : code;
                      const isDragging = dragState?.kind === "drug" && dragState.dragIndex === index;
                      const isOver = dragState?.kind === "drug" && dragState.overIndex === index;
                      return (
                        <div
                          className={`priorityItem${isDragging ? " dragging" : ""}${isOver ? " dragOver" : ""}`}
                          draggable
                          key={code}
                          onDragEnd={() => {
                            if (dragState && dragState.kind === "drug" && dragState.overIndex !== dragState.dragIndex) {
                              setQuickCreate(cur => {
                                const next = [...cur.drugCodes];
                                const [moved] = next.splice(dragState.dragIndex, 1);
                                next.splice(dragState.overIndex, 0, moved);
                                return { ...cur, drugCodes: next };
                              });
                            }
                            setDragState(null);
                          }}
                          onDragOver={(e) => { e.preventDefault(); setDragState(s => s ? { ...s, overIndex: index } : s); }}
                          onDragStart={() => setDragState({ kind: "drug", dragIndex: index, overIndex: index })}
                        >
                          <span className="dragHandle">⠿</span>
                          <span className="priorityIndex">{index + 1}</span>
                          <span className="priorityName">{name}</span>
                          <small className="priorityCode">{code}</small>
                          <button
                            className="priorityRemove"
                            onClick={() => setQuickCreate(cur => ({
                              ...cur,
                              drugCodes: cur.drugCodes.filter(c => c !== code),
                              drugMappingNotes: Object.fromEntries(Object.entries(cur.drugMappingNotes).filter(([k]) => k !== code))
                            }))}
                            title="Bỏ chọn"
                            type="button"
                          >✕</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <label className="controlField">
                <span>Ghi chú chuyên môn cho nhóm thuốc</span>
                <textarea
                  placeholder="Ví dụ: Ưu tiên điều trị triệu chứng trước, chỉ cân nhắc kháng sinh khi có bằng chứng gợi ý nhiễm khuẩn."
                  value={quickCreate.medicationRoleNote}
                  onChange={(event) =>
                    setQuickCreate((current) => ({ ...current, medicationRoleNote: event.target.value }))
                  }
                />
              </label>
              <div className="mappingDetailsBox">
                <div className="inlineCreateHeader">
                  <strong>Thiết lập riêng cho từng thuốc trong ICD này</strong>
                  <span>Phần này sẽ lưu vào mapping ICD - thuốc, không làm thay đổi danh mục thuốc dùng chung.</span>
                </div>
                {selectedDrugDetails.length > 0 ? (
                  <div className="mappingDetailsList">
                    {selectedDrugDetails.map((item) => (
                      <label className="mappingDetailCard" key={`drug-${item.code}`}>
                        <div className="mappingDetailHeader">
                          <strong>{item.name}</strong>
                          <span>{item.group || item.code}</span>
                        </div>
                        {item.catalogHint ? <small className="mappingCatalogHint">Thông tin đang có trong danh mục nền: {item.catalogHint}</small> : null}
                        <textarea
                          placeholder="Ví dụ: bôi, uống ngắn ngày, chỉ cân nhắc khi có biểu hiện viêm rõ hoặc cần điều trị theo mức độ."
                          value={item.note}
                          onChange={(event) =>
                            setQuickCreate((current) => ({
                              ...current,
                              drugMappingNotes: {
                                ...current.drugMappingNotes,
                                [item.code]: event.target.value
                              }
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="emptyMappingState">Chọn ít nhất 1 thuốc hoặc nhóm thuốc để nhập thông tin riêng cho ICD này.</div>
                )}
              </div>
              <div className="inlineCreateBox">
                <div className="inlineCreateHeader">
                  <strong>Thêm mới vào danh mục thuốc dùng chung</strong>
                  <span>Mục thêm ở đây sẽ đi vào tab `catalog_medication`, sau đó tự được chọn ngay cho ICD đang mở.</span>
                </div>
                <div className="quickCreateGrid">
                  <label className="controlField">
                    <span>Tên hiển thị</span>
                    <input
                      placeholder="Ví dụ: Azithromycin 500 mg"
                      value={quickAddMedication.name}
                      onChange={(event) =>
                        setQuickAddMedication((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </label>
                  <label className="controlField">
                    <span>Nhóm thuốc</span>
                    <input
                      placeholder="Ví dụ: Kháng sinh"
                      value={quickAddMedication.group}
                      onChange={(event) =>
                        setQuickAddMedication((current) => ({ ...current, group: event.target.value }))
                      }
                    />
                  </label>
                  <label className="controlField">
                    <span>Thông tin nền của mục này</span>
                    <input
                      placeholder="Ví dụ: Uống / 500 mg"
                      value={`${quickAddMedication.route}${quickAddMedication.route && quickAddMedication.strength ? " / " : ""}${quickAddMedication.strength}`}
                      onChange={(event) => {
                        const [route, strength] = event.target.value.split("/").map((item) => item.trim());
                        setQuickAddMedication((current) => ({
                          ...current,
                          route: route ?? "",
                          strength: strength ?? ""
                        }));
                      }}
                    />
                  </label>
                </div>
                <div className="detailActions compactActions">
                  <button
                    className="adminButton secondary"
                    disabled={loading !== null}
                    onClick={() => void createCatalogEntry("medication")}
                    type="button"
                  >
                    {loading === "save" ? "Đang lưu..." : "+ Thêm thuốc / nhóm thuốc mới"}
                  </button>
                </div>
                {lastCreatedCatalogEntry?.kind === "medication" ? (
                  <div className="generatedCodeNote">
                    <strong>Đã tạo mục mới:</strong>
                    <span>{lastCreatedCatalogEntry.name}</span>
                    <small>Mục này đã vào danh mục thuốc dùng chung. Mã hệ thống: {lastCreatedCatalogEntry.code}</small>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

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
                  onChange={(event) => setQuickCreate((current) => ({ ...current, protocolName: event.target.value }))}
                />
              </label>
              <label className="controlField">
                <span>Đơn vị phụ trách phác đồ</span>
                <input
                  placeholder="Ví dụ: Phòng khám Tai mũi họng"
                  value={quickCreate.protocolOwner}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, protocolOwner: event.target.value }))}
                />
              </label>
              <label className="controlField">
                <span>Trạng thái áp dụng</span>
                <select
                  value={quickCreate.protocolStatus}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, protocolStatus: event.target.value }))}
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
                Các xét nghiệm và thuốc đã chọn cho ICD này sẽ được ghi thành protocol item, ưu tiên theo thứ tự bạn đang sắp xếp/chọn.
              </p>
            </div>
          </div>

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
                  onChange={(event) => setQuickCreate((current) => ({ ...current, icdRatioMax: event.target.value }))}
                />
              </label>
              <label className="controlField">
                <span>Tỷ trọng CLS tối đa (%)</span>
                <input
                  inputMode="numeric"
                  placeholder="Ví dụ: 40"
                  value={quickCreate.clsRatioMax}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, clsRatioMax: event.target.value }))}
                />
              </label>
              <label className="controlField">
                <span>Tỷ trọng thuốc tối đa (%)</span>
                <input
                  inputMode="numeric"
                  placeholder="Ví dụ: 30"
                  value={quickCreate.drugRatioMax}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, drugRatioMax: event.target.value }))}
                />
              </label>
            </div>
            <div className="ruleSetOfficialCard">
              <div>
                <strong>Rule set xuất toán cơ bản</strong>
                <p>Đây là rule set chính thức cho flow nhập ICD theo trục ICD + CLS + thuốc, dùng để cảnh báo tương quan chi phí trước khi hiển thị cho bác sĩ.</p>
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
                  <button className="adminButton secondary" onClick={() => applyCostSuggestion(suggestion)} type="button">
                    Áp dụng gợi ý này
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="intakeSection">
            <div className="intakeSectionHeader">
              <strong>7. Cảnh báo chuyên môn</strong>
              <span>Nêu rõ điều gì dễ chỉ định chưa phù hợp hoặc dễ phát sinh nguy cơ xuất toán.</span>
            </div>
            <div className="quickCreateGrid singleColumn">
              <label className="controlField">
                <span>Điều cần lưu ý khi chỉ định</span>
                <textarea
                  placeholder="Ví dụ: Cần rà soát chỉ định X-quang phổi và kháng sinh nếu chưa có bằng chứng lâm sàng phù hợp."
                  value={quickCreate.warningMessage}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, warningMessage: event.target.value }))}
                />
              </label>

              <label className="controlField">
                <span>Lưu ý về BHYT / cơ cấu chi phí</span>
                <textarea
                  placeholder="Ví dụ: Tránh chỉ định đồng thời nhiều CLS nâng cao trong lần khám đầu nếu chưa có dấu hiệu nặng; cơ cấu chi phí nên ưu tiên phần ICD và CLS cơ bản."
                  value={quickCreate.reimbursementNote}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, reimbursementNote: event.target.value }))}
                />
              </label>
            </div>
          </div>

          <div className="intakeSection">
            <div className="intakeSectionHeader">
              <strong>8. Hành động gợi ý cho bác sĩ</strong>
              <span>Câu này sẽ là phần hệ thống ưu tiên hiển thị khi bác sĩ tải gợi ý.</span>
            </div>
            <div className="quickCreateGrid singleColumn">
              <label className="controlField">
                <span>Gợi ý hiển thị cho bác sĩ</span>
                <textarea
                  placeholder="Ví dụ: Ưu tiên CLS cơ bản trước, chỉ thêm thuốc/CLS nâng cao khi có dấu hiệu nặng."
                  value={quickCreate.recommendedAction}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, recommendedAction: event.target.value }))}
                />
              </label>

              <label className="controlField">
                <span>Ghi chú chuyên môn nội bộ</span>
                <textarea
                  placeholder="Ví dụ: Bổ sung theo phác đồ nội khoa tháng 4/2026."
                  value={quickCreate.note}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, note: event.target.value }))}
                />
              </label>
            </div>
          </div>

          <div className="quickCreateGrid singleColumn">
            <label className="controlField">
              <span>Tóm tắt để hệ thống tự ghi kỹ thuật nền</span>
              <textarea
                placeholder="Tự do ghi thêm các lưu ý khác; hệ thống sẽ dùng phần này cùng các mục ở trên để tạo dữ liệu nền kỹ thuật."
                value={quickCreate.systemSupportNote}
                onChange={(event) => setQuickCreate((current) => ({ ...current, systemSupportNote: event.target.value }))}
              />
            </label>
          </div>

          <div className="detailActions">
            <button className="adminButton" disabled={loading !== null} onClick={() => void createQuickBundle()} type="button">
              {loading === "save"
                ? "Đang lưu phiếu..."
                : activeIcdCode
                  ? "Cập nhật ICD đang chọn"
                  : "Lưu bệnh mới vào hệ thống"}
            </button>
            <button
              className="adminButton secondary"
              disabled={loading === "save"}
              onClick={() => {
                setQuickCreate(createEmptyQuickCreate());
                setActiveIcdCode("");
              }}
              type="button"
            >
              Làm trống phiếu
            </button>
          </div>
        </section>

        <section className="surface fade-4">
          <div className="surfaceHeader">
            <h3>Công cụ kỹ thuật khi cần</h3>
            <button className="toggleTechnicalButton" onClick={() => setTechnicalOpen((current) => !current)} type="button">
              {technicalOpen ? "Ẩn công cụ kỹ thuật" : "Mở công cụ kỹ thuật"}
            </button>
          </div>
          <p className="selectorSummary">
            Ẩn mặc định để màn quản trị tập trung vào nhập liệu ICD. Chỉ mở khi cần kiểm tra Apps Script, workbook hoặc dữ liệu gốc.
          </p>
        </section>

        {technicalOpen && template ? (
          <section className="surface fade-3">
            <div className="surfaceHeader">
              <h3>Mẫu tab đang lấy từ Apps Script</h3>
              <span>{template.tabs.length} tab kỳ vọng</span>
            </div>
            <div className="templateGrid">
              {template.tabs.map((tab) => (
                <div className="templateCard" key={tab}>
                  <strong>{tab}</strong>
                  <span>Đã khai báo trong template</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {technicalOpen && inspect ? (
          <section className="surface fade-3">
            <div className="surfaceHeader">
              <h3>Dữ liệu đang lấy trực tiếp từ Google Sheet</h3>
              <span>{inspect.ready ? "Sẵn sàng" : "Cần bổ sung"}</span>
            </div>
            <div className="rows">
              {inspect.tabs.map((tab) => (
                <article className="row sheetRow" key={tab.name}>
                  <div>
                    <strong>{tab.name}</strong>
                    <p>{tab.exists ? `${tab.rowCount} dòng dữ liệu, ${tab.columnCount} cột` : "Chưa có tab trong workbook"}</p>
                    <small>{tab.headers.length > 0 ? `Header: ${tab.headers.join(", ")}` : "Chưa đọc được header"}</small>
                  </div>
                  <div className="meta">
                    <span>{tab.exists ? "Có tab" : "Thiếu tab"}</span>
                    <strong>{tab.missingColumns.length === 0 ? "Đủ cột" : `Thiếu ${tab.missingColumns.length} cột`}</strong>
                    {tab.missingColumns.length > 0 ? <small>{tab.missingColumns.join(", ")}</small> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {technicalOpen && preview ? (
          <section className="surface fade-4">
            <div className="surfaceHeader">
              <h3>Xem nhanh dữ liệu thật từ Google Sheet</h3>
              <span>{preview.tabs.length} tab đang hiển thị</span>
            </div>

            <div className="previewControls">
              <label className="controlField">
                <span>Chọn tab</span>
                <select value={selectedPreviewTab} onChange={(event) => setSelectedPreviewTab(event.target.value)}>
                  <option value="all">Tất cả tab</option>
                  {tabGroups.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.tabs
                        .filter((tabName) => preview.tabs.some((tab) => tab.name === tabName))
                        .map((tabName) => (
                          <option key={tabName} value={tabName}>
                            {tabLabels[tabName] ?? tabName}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              <label className="controlField controlFieldSearch">
                <span>Tìm nhanh theo mã hoặc tên</span>
                <input
                  placeholder="Ví dụ: I10, metformin, creatinine..."
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
            </div>

            <div className="previewToolbar">
              <div className="previewSummary">
                <strong>{filteredPreviewTabs.length}</strong>
                <span>tab phù hợp{normalizedSearchTerm ? ` với từ khóa "${searchTerm}"` : ""}.</span>
              </div>
              <button className="adminButton secondary" onClick={exportFilteredCsv} type="button">
                Xuất CSV theo bộ lọc
              </button>
            </div>

            <div className="previewLayout">
              <div className="previewStack">
                {filteredPreviewTabs.map((tab) => (
                  <article className="previewCard" key={tab.name}>
                    <div className="previewHeader">
                      <div>
                        <strong>{tabLabels[tab.name] ?? tab.name}</strong>
                        <p>Hiển thị {tab.filteredRows.length} dòng đang khớp, tổng cộng {tab.rowCount} dòng dữ liệu trong tab.</p>
                      </div>
                      <span className="previewBadge">{tab.headers.length} cột</span>
                    </div>

                    {tab.filteredRows.length > 0 ? (
                      <div className="previewTableWrap">
                        <table className="previewTable">
                          <thead>
                            <tr>
                              <th>Thao tác</th>
                              {tab.headers.map((header) => (
                                <th key={header}>{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {tab.filteredRows.map((row, index) => {
                              const primaryCode = getPrimaryCode(row);

                              return (
                                <tr key={`${tab.name}-${index}`}>
                                  <td className="actionCell">
                                    <div className="actionStack">
                                      {primaryCode ? (
                                        <button className="copyButton" onClick={() => void copyCode(primaryCode)} type="button">
                                          Copy mã
                                        </button>
                                      ) : (
                                        <span className="copyPlaceholder">—</span>
                                      )}
                                      <button className="detailButton" onClick={() => openRecord(tab.name, row)} type="button">
                                        Xem chi tiết
                                      </button>
                                    </div>
                                  </td>
                                  {tab.headers.map((header) => {
                                    const cellValue = formatCellValue(row[header]);

                                    return (
                                      <td key={`${tab.name}-${index}-${header}`}>
                                        {highlightText(cellValue, normalizedSearchTerm)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="emptyPreview">
                        {normalizedSearchTerm
                          ? "Không có dòng nào khớp với từ khóa đang tìm."
                          : "Tab này đang chưa có dữ liệu mẫu để hiển thị."}
                      </div>
                    )}
                  </article>
                ))}

                {filteredPreviewTabs.length === 0 ? (
                  <div className="emptyPreview">Không có tab nào phù hợp với bộ lọc hiện tại.</div>
                ) : null}
              </div>

              <aside className="detailPanel">
                <div className="detailPanelHeader">
                  <strong>Chi tiết bản ghi</strong>
                  <span>{selectedRecord ? (tabLabels[selectedRecord.tabName] ?? selectedRecord.tabName) : "Chưa chọn dòng"}</span>
                </div>

                {selectedRecord ? (
                  <div className="detailFields">
                    {Object.entries(editDraft).map(([key, value]) => {
                      const isReadOnly = key === getPrimaryKeyField(selectedRecord.row);

                      return (
                        <label className="detailField" key={key}>
                          <span>{key}</span>
                          <input
                            disabled={isReadOnly || loading === "save"}
                            value={value}
                            onChange={(event) =>
                              setEditDraft((current) => ({
                                ...current,
                                [key]: event.target.value
                              }))
                            }
                          />
                        </label>
                      );
                    })}

                    <label className="detailField">
                      <span>Ghi chú thay đổi</span>
                      <textarea
                        placeholder="Ví dụ: cập nhật theo phản hồi chuyên môn nội khoa"
                        value={saveNote}
                        onChange={(event) => setSaveNote(event.target.value)}
                      />
                    </label>

                    <div className="detailActions">
                      <button className="adminButton" disabled={loading !== null} onClick={() => void saveRecord()} type="button">
                        {loading === "save" ? "Đang lưu..." : "Lưu về Google Sheet"}
                      </button>
                      <button className="adminButton secondary" disabled={loading === "save"} onClick={resetDraft} type="button">
                        Đặt lại
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="emptyPreview">Bấm `Xem chi tiết` ở một dòng bất kỳ để xem và chỉnh sửa thông tin.</div>
                )}
              </aside>
            </div>
          </section>
        ) : null}

        {technicalOpen && changeLog ? (
          <section className="surface fade-4">
            <div className="surfaceHeader">
              <h3>Lịch sử thay đổi gần nhất</h3>
              <span>{changeLog.total} bản ghi log</span>
            </div>

            <div className="logControls">
              <label className="controlField">
                <span>Lọc theo tab</span>
                <select value={logTabFilter} onChange={(event) => setLogTabFilter(event.target.value)}>
                  <option value="all">Tất cả tab</option>
                  {previewTabs.map((tabName) => (
                    <option key={tabName} value={tabName}>
                      {tabLabels[tabName] ?? tabName}
                    </option>
                  ))}
                  <option value="admin_change_log">admin_change_log</option>
                </select>
              </label>

              <label className="controlField controlFieldSearch">
                <span>Tìm trong log</span>
                <input
                  placeholder="Ví dụ: rule_claim_risk, admin-ui, metformin..."
                  type="search"
                  value={logKeyword}
                  onChange={(event) => setLogKeyword(event.target.value)}
                />
              </label>
            </div>

            <div className="previewSummary">
              <strong>{filteredChangeLogRows.length}</strong>
              <span>bản ghi log phù hợp với bộ lọc hiện tại.</span>
            </div>

            {filteredChangeLogRows.length > 0 ? (
              <div className="previewTableWrap">
                <table className="previewTable">
                  <thead>
                    <tr>
                      {Object.keys(filteredChangeLogRows[0]).map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChangeLogRows.map((row, index) => (
                      <tr key={`log-${index}`}>
                        {Object.keys(filteredChangeLogRows[0]).map((header) => (
                          <td key={`log-${index}-${header}`}>{highlightText(formatCellValue(row[header]), normalizedLogKeyword)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="emptyPreview">Chưa có thay đổi nào được ghi log.</div>
            )}
          </section>
        ) : null}

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
                  onChange={(event) => setQuickCreate((current) => ({ ...current, primaryRuleSet: event.target.value }))}
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
                  onChange={(event) => setQuickCreate((current) => ({ ...current, rulePriorityLevel: event.target.value }))}
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
                  onChange={(event) => setQuickCreate((current) => ({ ...current, ruleFocus: event.target.value }))}
                />
              </label>

              <label className="controlField checkboxField">
                <input
                  type="checkbox"
                  checked={quickCreate.ruleIsActive ?? true}
                  onChange={(event) => setQuickCreate((current) => ({ ...current, ruleIsActive: event.target.checked }))}
                />
                <div className="checkboxLabel">
                  <strong>Kích hoạt logic hoạt động của rule này trên hệ thống</strong>
                  <span>Ngay khi lưu, các cảnh báo tương quan và ưu tiên của rule set này sẽ bắt đầu được thực thi ở màn hình bác sĩ.</span>
                </div>
              </label>
            </div>
            <div className="rows compact">
              {ruleSets.map((item) => {
                const selected = quickCreate.primaryRuleSet === item.id;

                return (
                  <article className={`row compactRow${selected ? " selectedCompactRow" : ""}`} key={item.id}>
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
        </main>
    </div>
  );
}

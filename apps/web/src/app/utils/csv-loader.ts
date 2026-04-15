import { readFileSync } from "fs";
import path from "path";

/**
 * CSV Loader for Pilot Phase
 * Reads CSV seed files directly from the filesystem for fast local access.
 * No Google Sheets dependency — pure CSV-based data pipeline.
 */

const SEEDS_DIR = path.resolve(process.cwd(), "../../seeds/google-sheets-pilot");

// ── In-memory cache with lazy loading ──
const cache = new Map<string, { rows: Record<string, string>[]; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute (CSV changes rarely during pilot)

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function loadCsv(filename: string): Record<string, string>[] {
  const cached = cache.get(filename);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.rows;

  const filePath = path.join(SEEDS_DIR, filename);
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error(`[csv-loader] Cannot read ${filePath}:`, err);
    return [];
  }

  const lines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => l.trim());

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
  }

  cache.set(filename, { rows, ts: Date.now() });
  return rows;
}

// ── Typed accessors for seed data ──

export interface IcdEntry {
  code: string;
  name: string;
  chapter: string;
  isActive: boolean;
}

export function loadIcdCatalog(): IcdEntry[] {
  return loadCsv("catalog_icd.csv")
    .filter((r) => r.is_active?.toUpperCase() !== "FALSE")
    .map((r) => ({
      code: r.icd_code ?? "",
      name: r.icd_name ?? "",
      chapter: r.chapter ?? "",
      isActive: true,
    }))
    .filter((e) => e.code && e.name);
}

export interface ClsMapping {
  icdCode: string;
  clsCode: string;
  mappingType: string;
  priority: number;
  note: string;
  evidenceLevel: string;
}

export function loadIcdClsMappings(): ClsMapping[] {
  return loadCsv("mapping_icd_cls.csv").map((r) => ({
    icdCode: r.icd_code ?? "",
    clsCode: r.cls_code ?? "",
    mappingType: r.mapping_type ?? "",
    priority: Number(r.priority ?? 0),
    note: r.note ?? "",
    evidenceLevel: r.evidence_level ?? "IIa",
  }));
}

export interface MedicationMapping {
  icdCode: string;
  drugCode: string;
  mappingType: string;
  priority: number;
  note: string;
  evidenceLevel: string;
}

export function loadIcdMedicationMappings(): MedicationMapping[] {
  return loadCsv("mapping_icd_medication.csv").map((r) => ({
    icdCode: r.icd_code ?? "",
    drugCode: r.drug_code ?? "",
    mappingType: r.mapping_type ?? "",
    priority: Number(r.priority ?? 0),
    note: r.note ?? "",
    evidenceLevel: r.evidence_level ?? "IIa",
  }));
}

export interface ClsCatalogEntry {
  code: string;
  name: string;
  group: string;
  defaultFrequency: string;
  minRepeatIntervalDays: number;
  requiresRedFlag: boolean;
  restrictedSpecialty: string;
}

export function loadClsCatalog(): Map<string, ClsCatalogEntry> {
  const map = new Map<string, ClsCatalogEntry>();
  for (const r of loadCsv("catalog_cls.csv")) {
    const code = r.cls_code ?? "";
    if (code) {
      map.set(code, {
        code,
        name: r.cls_name ?? code,
        group: r.group_name ?? "",
        defaultFrequency: r.default_frequency ?? "",
        minRepeatIntervalDays: Number(r.min_repeat_interval_days ?? 0),
        requiresRedFlag: r.requires_red_flag?.toUpperCase() === "TRUE",
        restrictedSpecialty: r.restricted_specialty ?? "",
      });
    }
  }
  return map;
}

export interface MedicationCatalogEntry {
  code: string;
  name: string;
  route: string;
  strength: string;
  maxDurationDays: number;
  maxQuantityPerRx: number;
  requiresMonitoringCls: string;
  contraindicatedIcd: string;
}

export function loadMedicationCatalog(): Map<string, MedicationCatalogEntry> {
  const map = new Map<string, MedicationCatalogEntry>();
  for (const r of loadCsv("catalog_medication.csv")) {
    const code = r.drug_code ?? "";
    if (code) {
      map.set(code, {
        code,
        name: r.drug_name ?? code,
        route: r.route ?? "",
        strength: r.strength ?? "",
        maxDurationDays: Number(r.max_duration_days ?? 30),
        maxQuantityPerRx: Number(r.max_quantity_per_rx ?? 90),
        requiresMonitoringCls: r.requires_monitoring_cls ?? "",
        contraindicatedIcd: r.contraindicated_icd ?? "",
      });
    }
  }
  return map;
}

export interface ClaimRiskRule {
  ruleCode: string;
  ruleName: string;
  severity: string;
  appliesToIcd: string;
  warningMessage: string;
  recommendedAction: string;
  conditionExpression: string;
  conditionType: string;
  conditionParameter: string;
  isActive: boolean;
}

export function loadClaimRiskRules(): ClaimRiskRule[] {
  return loadCsv("rule_claim_risk.csv")
    .filter((r) => r.is_active?.toUpperCase() !== "FALSE")
    .map((r) => ({
      ruleCode: r.rule_code ?? "",
      ruleName: r.rule_name ?? "",
      severity: r.severity ?? "medium",
      appliesToIcd: r.applies_to_icd ?? "",
      warningMessage: r.warning_message ?? "",
      recommendedAction: r.recommended_action ?? "",
      conditionExpression: r.condition_expression ?? "",
      conditionType: r.condition_type ?? "",
      conditionParameter: r.condition_parameter ?? "",
      isActive: true,
    }));
}

export interface SymptomEntry {
  code: string;
  name: string;
  synonyms: string;
  bodySystem: string;
}

export function loadSymptomCatalog(): SymptomEntry[] {
  return loadCsv("catalog_symptom.csv")
    .filter((r) => r.is_active?.toUpperCase() !== "FALSE")
    .map((r) => ({
      code: r.symptom_code ?? "",
      name: r.symptom_name ?? "",
      synonyms: r.synonym_vi ?? "",
      bodySystem: r.body_system ?? "",
    }))
    .filter((e) => e.code && e.name);
}

export interface SymptomIcdMapping {
  symptomCode: string;
  icdCode: string;
  relevanceScore: number;
}

export function loadSymptomIcdMappings(): SymptomIcdMapping[] {
  return loadCsv("mapping_symptom_icd.csv").map((r) => ({
    symptomCode: r.symptom_code ?? "",
    icdCode: r.icd_code ?? "",
    relevanceScore: Number(r.relevance_score ?? 50),
  }));
}

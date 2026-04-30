export function splitPipeCodes(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split("|")
    .map((code) => code.trim())
    .filter(Boolean);
}

export function matchesIcdPrefix(icdCodes: string[], appliesToIcd?: string): boolean {
  const targets = splitPipeCodes(appliesToIcd);
  if (targets.length === 0) return true;
  return icdCodes.some((code) => targets.some((target) => code.startsWith(target)));
}

export function sanitizeRuleParameter(raw?: string): string | undefined {
  if (typeof raw !== "string") return undefined;
  const cleaned = raw.trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

export interface ClaimRiskRuleLike {
  severity: "high" | "medium" | "low";
  title: string;
  message: string;
  actionHint?: string;
  itemCode?: string;
  conditionType?: string;
  requiredEvidenceCode?: string;
}

interface BuildRuleOptions {
  missingEvidenceRequiresIcd?: boolean;
}

export interface ClaimRiskRuleBuildStats {
  inputRows: number;
  outputRules: number;
  excludedMissingEvidenceWithoutIcd: number;
  normalizedSeverityCount: number;
  emptyTitleCount: number;
  emptyMessageCount: number;
}

function normalizeSeverity(raw: unknown): "high" | "medium" | "low" {
  if (typeof raw !== "string") return "medium";
  const normalized = raw.toLowerCase().trim();
  if (normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized;
  }
  return "medium";
}

function sanitizeText(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim();
}

export function buildClaimRiskRulesFromCsvRows(
  rows: any[],
  icdCodes: string[],
  options: BuildRuleOptions = {}
): ClaimRiskRuleLike[] {
  return buildClaimRiskRulesWithStats(rows, icdCodes, options).rules;
}

export function buildClaimRiskRulesWithStats(
  rows: any[],
  icdCodes: string[],
  options: BuildRuleOptions = {}
): { rules: ClaimRiskRuleLike[]; stats: ClaimRiskRuleBuildStats } {
  const { missingEvidenceRequiresIcd = false } = options;
  const stats: ClaimRiskRuleBuildStats = {
    inputRows: rows.length,
    outputRules: 0,
    excludedMissingEvidenceWithoutIcd: 0,
    normalizedSeverityCount: 0,
    emptyTitleCount: 0,
    emptyMessageCount: 0
  };

  const rules = rows
    .flatMap((r: any) => {
      if (r.condition_type === "MISSING_REQUIRED_EVIDENCE" && missingEvidenceRequiresIcd && !r.applies_to_icd) {
        stats.excludedMissingEvidenceWithoutIcd += 1;
        return [];
      }

      if (r.applies_to_icd && !matchesIcdPrefix(icdCodes, r.applies_to_icd)) {
        return [];
      }

      const normalizedSeverity = normalizeSeverity(r.severity);
      if (typeof r.severity !== "string" || r.severity.toLowerCase().trim() !== normalizedSeverity) {
        stats.normalizedSeverityCount += 1;
      }

      const title = sanitizeText(r.rule_name);
      const message = sanitizeText(r.warning_message);
      if (!title) stats.emptyTitleCount += 1;
      if (!message) stats.emptyMessageCount += 1;

      return [{
        severity: normalizedSeverity,
        title,
        message,
        actionHint: sanitizeText(r.recommended_action) || undefined,
        itemCode: sanitizeRuleParameter(r.applies_to_cls) || sanitizeRuleParameter(r.applies_to_drug),
        conditionType: sanitizeText(r.condition_type) || undefined,
        requiredEvidenceCode: sanitizeRuleParameter(r.condition_parameter)
      }];
    });

  stats.outputRules = rules.length;
  return { rules, stats };
}

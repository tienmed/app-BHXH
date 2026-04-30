import test from "node:test";
import assert from "node:assert/strict";
import { buildClaimRiskRulesFromCsvRows, buildClaimRiskRulesWithStats } from "../src/rule-utils";

test("invalid severity should fallback to medium", () => {
  const rules = buildClaimRiskRulesFromCsvRows(
    [
      {
        severity: "CRITICAL",
        rule_name: "Rule A",
        warning_message: "Warn",
        condition_type: "GENERAL"
      }
    ],
    ["I10"]
  );

  assert.equal(rules[0].severity, "medium");
});

test("missing-evidence rule without ICD should be excluded when option is enabled", () => {
  const rules = buildClaimRiskRulesFromCsvRows(
    [
      {
        severity: "high",
        rule_name: "Rule B",
        warning_message: "Warn",
        condition_type: "MISSING_REQUIRED_EVIDENCE"
      }
    ],
    ["I10"],
    { missingEvidenceRequiresIcd: true }
  );

  assert.equal(rules.length, 0);
});

test("fields should be trimmed and empty action/item converted to undefined", () => {
  const rules = buildClaimRiskRulesFromCsvRows(
    [
      {
        severity: " low ",
        rule_name: "  Rule C  ",
        warning_message: "  Warn  ",
        recommended_action: "   ",
        applies_to_cls: "   ",
        applies_to_drug: " DRUG-A ",
        condition_type: "  GENERAL  ",
        condition_parameter: "  CLS-TSH  "
      }
    ],
    ["I10"]
  );

  assert.equal(rules[0].severity, "low");
  assert.equal(rules[0].title, "Rule C");
  assert.equal(rules[0].message, "Warn");
  assert.equal(rules[0].actionHint, undefined);
  assert.equal(rules[0].itemCode, "DRUG-A");
  assert.equal(rules[0].conditionType, "GENERAL");
  assert.equal(rules[0].requiredEvidenceCode, "CLS-TSH");
});

test("should return useful build stats for observability", () => {
  const { rules, stats } = buildClaimRiskRulesWithStats(
    [
      {
        severity: "CRITICAL",
        rule_name: "  ",
        warning_message: " ",
        condition_type: "MISSING_REQUIRED_EVIDENCE"
      },
      {
        severity: "high",
        rule_name: "Rule D",
        warning_message: "Warn D",
        condition_type: "GENERAL",
        applies_to_icd: "E11"
      }
    ],
    ["I10"],
    { missingEvidenceRequiresIcd: true }
  );

  assert.equal(rules.length, 0);
  assert.equal(stats.inputRows, 2);
  assert.equal(stats.outputRules, 0);
  assert.equal(stats.excludedMissingEvidenceWithoutIcd, 1);
  assert.equal(stats.normalizedSeverityCount, 0);
  assert.equal(stats.emptyTitleCount, 0);
  assert.equal(stats.emptyMessageCount, 0);
});

test("fixture mapping should remain deterministic for mixed ICD and rule rows", () => {
  const rows = [
    {
      severity: "HIGH",
      rule_name: " Rule E ",
      warning_message: " Msg E ",
      recommended_action: " Act E ",
      applies_to_icd: "E03|E04",
      applies_to_cls: " CLS-TSH ",
      condition_type: "MISSING_REQUIRED_EVIDENCE",
      condition_parameter: " CLS-FT4 "
    },
    {
      severity: "unknown",
      rule_name: "Rule F",
      warning_message: "Msg F",
      applies_to_icd: "I10",
      applies_to_drug: " DRUG-A ",
      condition_type: "GENERAL"
    },
    {
      severity: "low",
      rule_name: "Rule G",
      warning_message: "Msg G",
      applies_to_icd: "E11",
      applies_to_drug: "DRUG-B",
      condition_type: "GENERAL"
    }
  ];

  const rules = buildClaimRiskRulesFromCsvRows(rows, ["E03.9"]);
  assert.deepEqual(rules, [
    {
      severity: "high",
      title: "Rule E",
      message: "Msg E",
      actionHint: "Act E",
      itemCode: "CLS-TSH",
      conditionType: "MISSING_REQUIRED_EVIDENCE",
      requiredEvidenceCode: "CLS-FT4"
    }
  ]);
});

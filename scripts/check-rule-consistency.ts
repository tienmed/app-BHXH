import assert from "node:assert/strict";
import { buildClaimRiskRulesWithStats } from "@app-bhxh/domain";

const fixtureRows = [
  {
    severity: "high",
    rule_name: "Need evidence",
    warning_message: "Missing required evidence",
    condition_type: "MISSING_REQUIRED_EVIDENCE",
    applies_to_drug: "DRUG-A",
    condition_parameter: "CLS-TSH"
  },
  {
    severity: "medium",
    rule_name: "General warning",
    warning_message: "General",
    condition_type: "GENERAL",
    applies_to_icd: "E03|E04",
    applies_to_cls: "CLS-FT4"
  }
];

function run() {
  const icdCodes = ["E03.9"];

  // API behavior: strict missing-evidence ICD context required
  const api = buildClaimRiskRulesWithStats(fixtureRows, icdCodes, {
    missingEvidenceRequiresIcd: true
  });

  // Web behavior: default mode (non-strict missing-evidence ICD context)
  const web = buildClaimRiskRulesWithStats(fixtureRows, icdCodes);

  // Both channels should still include shared GENERAL rule
  assert.ok(api.rules.some((r) => r.title === "General warning"));
  assert.ok(web.rules.some((r) => r.title === "General warning"));

  // Intentional behavioral difference:
  // API excludes missing-evidence row without ICD, web includes it.
  assert.ok(!api.rules.some((r) => r.title === "Need evidence"));
  assert.ok(web.rules.some((r) => r.title === "Need evidence"));
  assert.equal(api.stats.excludedMissingEvidenceWithoutIcd, 1);
  assert.equal(web.stats.excludedMissingEvidenceWithoutIcd, 0);

  console.log(
    JSON.stringify(
      {
        ok: true,
        summary: {
          apiOutputRules: api.rules.length,
          webOutputRules: web.rules.length,
          apiExcludedMissingEvidenceWithoutIcd: api.stats.excludedMissingEvidenceWithoutIcd,
          webExcludedMissingEvidenceWithoutIcd: web.stats.excludedMissingEvidenceWithoutIcd
        }
      },
      null,
      2
    )
  );
}

run();

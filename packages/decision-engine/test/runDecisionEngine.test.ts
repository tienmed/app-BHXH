import test from "node:test";
import assert from "node:assert/strict";
import { runDecisionEngine, type EngineInput } from "../src/index";

function baseInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    diagnoses: [{ icd: "E03.9", label: "Suy giáp" }],
    protocols: [
      {
        code: "AUTO",
        items: [
          { type: "CLS", code: "CLS-XN-TSH", name: "TSH" },
          { type: "MEDICATION", code: "DRUG-LEVOTHYROXINE", name: "Levothyroxine" }
        ]
      }
    ],
    rules: { claimRisk: [] },
    ...overrides
  };
}

test("missing evidence should trigger when trigger item selected but evidence absent", async () => {
  const output = await runDecisionEngine(
    baseInput({
      draftOrders: ["DRUG-LEVOTHYROXINE"],
      rules: {
        claimRisk: [
          {
            severity: "high",
            title: "Thiếu xét nghiệm",
            message: "Thiếu bằng chứng CLS",
            itemCode: "DRUG-LEVOTHYROXINE",
            conditionType: "MISSING_REQUIRED_EVIDENCE",
            requiredEvidenceCode: "CLS-XN-TSH"
          }
        ]
      }
    })
  );

  assert.equal(output.alerts.length, 1);
  assert.equal(output.riskScore, 30);
});

test("missing evidence should not trigger when required evidence present", async () => {
  const output = await runDecisionEngine(
    baseInput({
      draftOrders: ["DRUG-LEVOTHYROXINE", "CLS-XN-TSH"],
      rules: {
        claimRisk: [
          {
            severity: "high",
            title: "Thiếu xét nghiệm",
            message: "Thiếu bằng chứng CLS",
            itemCode: "DRUG-LEVOTHYROXINE",
            conditionType: "MISSING_REQUIRED_EVIDENCE",
            requiredEvidenceCode: "CLS-XN-TSH"
          }
        ]
      }
    })
  );

  assert.equal(output.alerts.length, 0);
  assert.equal(output.riskScore, 0);
});

test("pipe-separated item/evidence codes should be evaluated correctly", async () => {
  const output = await runDecisionEngine(
    baseInput({
      draftOrders: ["DRUG-LEVOTHYROXINE"],
      rules: {
        claimRisk: [
          {
            severity: "medium",
            title: "Thiếu xét nghiệm",
            message: "Thiếu bằng chứng CLS",
            itemCode: "DRUG-LEVOTHYROXINE|DRUG-ALT",
            conditionType: "MISSING_REQUIRED_EVIDENCE",
            requiredEvidenceCode: "CLS-XN-TSH|CLS-XN-FT4"
          }
        ]
      }
    })
  );

  assert.equal(output.alerts.length, 1);
  assert.equal(output.riskScore, 15);
});

test("without draft orders, engine should fallback to protocol items for rule triggering", async () => {
  const output = await runDecisionEngine(
    baseInput({
      draftOrders: [],
      rules: {
        claimRisk: [
          {
            severity: "low",
            title: "Thiếu xét nghiệm",
            message: "Thiếu bằng chứng CLS",
            itemCode: "DRUG-LEVOTHYROXINE",
            conditionType: "MISSING_REQUIRED_EVIDENCE",
            requiredEvidenceCode: "CLS-NOT-IN-PROTOCOL"
          }
        ]
      }
    })
  );

  assert.equal(output.alerts.length, 1);
  assert.equal(output.riskScore, 5);
});

import { test } from "node:test";
import assert from "node:assert";
import { runDecisionEngine, EngineInput } from "../src/index.js";

test("runDecisionEngine - Multi-ICD scoring", async () => {
  const input: EngineInput = {
    diagnoses: [
      { icd: "E11.9", label: "Diabetes" },
      { icd: "I10", label: "Hypertension" }
    ],
    protocols: [
      {
        code: "E11.9",
        items: [
          { type: "CLS", code: "CLS001", name: "Blood Sugar", note: "Monitor glucose" },
          { type: "CLS", code: "CLS002", name: "Common Test", note: "Routine check" }
        ]
      },
      {
        code: "I10",
        items: [
          { type: "CLS", code: "CLS003", name: "ECG", note: "Heart check" },
          { type: "CLS", code: "CLS002", name: "Common Test", note: "Hypertension check" }
        ]
      }
    ],
    rules: { claimRisk: [] }
  };

  const output = await runDecisionEngine(input);

  // CLS002 is in both protocols, so it should have 100% priority score
  const commonTest = output.investigations.find(i => i.code === "CLS002");
  assert.strictEqual(commonTest?.priorityScore, 100);
  assert.ok(commonTest?.supportingIcds?.includes("E11.9"));
  assert.ok(commonTest?.supportingIcds?.includes("I10"));
  assert.ok(commonTest?.note?.includes("Routine check"));
  assert.ok(commonTest?.note?.includes("Hypertension check"));

  // CLS001 is only in one, so 50%
  const bloodSugar = output.investigations.find(i => i.code === "CLS001");
  assert.strictEqual(bloodSugar?.priorityScore, 50);
});

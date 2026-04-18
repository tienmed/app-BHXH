const { runDecisionEngine } = require("./packages/decision-engine/dist/index");

async function test() {
    const input = {
        diagnoses: [{ icd: "E11.9", label: "Diabetes" }],
        protocols: [{
            code: "P1",
            items: [
                { type: "CLS", code: "CLS-XN-HBA1C", name: "HbA1c", note: "EBM note" }
            ]
        }],
        draftOrders: ["CLS-XN-HBA1C"],
        rules: {
            claimRisk: [
                { severity: "high", title: "Lặp lại HbA1c", message: "Cảnh báo" }
            ]
        }
    };

    const output = await runDecisionEngine(input);
    console.log("Output:", JSON.stringify(output, null, 2));
}

test().catch(console.error);

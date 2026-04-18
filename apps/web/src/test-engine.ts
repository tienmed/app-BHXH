import { clinicalEngine } from "./lib/clinical-engine";

async function test() {
    const res = await clinicalEngine.getPreview({
        diagnoses: [{ icd: "J44.9", label: "COPD", type: "primary" }],
        draftOrders: []
    });
    console.log(JSON.stringify(res.reimbursementGuard, null, 2));
}
test();

export const pilotProfile = {
  careSetting: "outpatient",
  specialty: "internal-medicine",
  actionMode: "recommendation-only",
  protocolSource: "Ministry of Health seed guidance",
  futureMode: "clinic-level customization"
} as const;

export const boundaryPrinciples = [
  "doctor-remains-final-decision-maker",
  "clinical-rules-and-reimbursement-rules-stay-separate",
  "every-override-must-be-auditable",
  "knowledge-must-be-versioned"
] as const;

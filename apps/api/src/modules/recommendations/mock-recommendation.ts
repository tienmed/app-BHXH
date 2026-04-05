export function buildPreviewRecommendation() {
  return {
    encounter: {
      code: "OP-IM-0001",
      careSetting: "outpatient",
      specialty: "internal-medicine"
    },
    diagnoses: [
      { icd: "I10", label: "Tang huyet ap nguyen phat", type: "primary" },
      { icd: "E11.9", label: "Dai thao duong typ 2 khong bien chung", type: "secondary" },
      { icd: "E78.5", label: "Roi loan lipid mau", type: "secondary" }
    ],
    recommendations: {
      investigations: [
        "Cong thuc mau, glucose, HbA1c, creatinine, AST/ALT",
        "Tong phan tich nuoc tieu va microalbumin nieu",
        "Dien tam do 12 chuyen dao"
      ],
      medicationGroups: [
        "Nhom UCMC/UCTT",
        "Statin cuong do vua",
        "Khung thuoc ha duong huyet theo danh muc duoc phe duyet"
      ]
    },
    reimbursementGuard: {
      costComposition: {
        icd: 28,
        cls: 41,
        medications: 31
      },
      alerts: [
        {
          severity: "high",
          message: "Can kiem tra tan suat xet nghiem lap lai de tranh query/xuat toan."
        },
        {
          severity: "medium",
          message: "Moi CLS va thuoc can giai trinh duoc bang ICD chinh hoac benh dong mac."
        }
      ]
    },
    provenance: {
      protocolSource: "Ministry of Health seed guidance",
      ruleSource: "Initial reimbursement guard baseline",
      explainability: "every alert and suggestion should point to a versioned source in later phases"
    }
  };
}

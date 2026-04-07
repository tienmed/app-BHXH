

// read the env file manually if needed, or hardcode it since we found it
const URL = "https://script.google.com/macros/s/AKfycbzfgoGvVv2hjHvLZ6pKOAr2728Q3DJ2MoprrPvKzUVLmRNlK8zMywn5u6s7P7mYhsvS/exec";

// Items to add
const clss = [
  { action: 'create-catalog-entry', kind: 'cls', code: 'CLS-DIEN-CO', name: 'Đo điện cơ (EMG)', group: 'Thăm dò chức năng', unit: 'lần', defaultFrequency: 'Theo đợt khám', sourceRef: 'MOH-NEURO-2026' },
  { action: 'create-catalog-entry', kind: 'cls', code: 'CLS-VIT-B12', name: 'Định lượng Vitamin B12', group: 'Xét nghiệm', unit: 'mẫu', defaultFrequency: '6 tháng', sourceRef: 'MOH-NEURO-2026' },
  { action: 'create-catalog-entry', kind: 'cls', code: 'CLS-SA-THAN-KINH', name: 'Siêu âm dây thần kinh ngoại biên', group: 'Chẩn đoán hình ảnh', unit: 'lần', defaultFrequency: 'Theo đợt khám', sourceRef: 'MOH-NEURO-2026' },
  { action: 'create-catalog-entry', kind: 'cls', code: 'TT-CHAM-CUU', name: 'Châm cứu', group: 'Thủ thuật', unit: 'lần', defaultFrequency: 'Theo đợt khám', sourceRef: 'MOH-NEURO-2026' },
];

const meds = [
  { action: 'create-catalog-entry', kind: 'medication', code: 'DR-NEURO-GABA', name: 'Gabapentin 300mg', group: 'Giảm đau thần kinh', route: 'Uống', strength: '300mg', isBhytCovered: true, sourceRef: 'FORMULARY-NEURO-2026' },
  { action: 'create-catalog-entry', kind: 'medication', code: 'DR-NEURO-PREGA', name: 'Pregabalin 75mg', group: 'Giảm đau thần kinh', route: 'Uống', strength: '75mg', isBhytCovered: true, sourceRef: 'FORMULARY-NEURO-2026' },
  { action: 'create-catalog-entry', kind: 'medication', code: 'DR-NEURO-AMI', name: 'Amitriptyline 25mg', group: 'Chống trầm cảm 3 vòng', route: 'Uống', strength: '25mg', isBhytCovered: true, sourceRef: 'FORMULARY-NEURO-2026' },
  { action: 'create-catalog-entry', kind: 'medication', code: 'DR-NEURO-VITB', name: 'Vitamin B complex', group: 'Vitamin hướng thần kinh', route: 'Uống', strength: 'viên', isBhytCovered: true, sourceRef: 'FORMULARY-NEURO-2026' },
];

const bundles = [
  {
    action: 'create-icd-rule-bundle',
    icdCode: 'G62.9',
    icdName: 'Bệnh viêm đa dây thần kinh không chỉ định',
    chapter: 'Bệnh hệ thần kinh',
    sourceVersion: 'MOH-NEURO-2026',
    protocolName: 'Nội thần kinh ngoại trú',
    protocolStatus: 'active',
    protocolOwner: 'Clinical Council',
    icdRatioMax: 10, clsRatioMax: 25, drugRatioMax: 55,
    clsCodes: ['CLS-DIEN-CO', 'CLS-VIT-B12'],
    clsSelections: [
      { code: 'CLS-DIEN-CO', selection: 'recommended' },
      { code: 'CLS-VIT-B12', selection: 'suggested' }
    ],
    drugCodes: ['DR-NEURO-GABA', 'DR-NEURO-PREGA', 'DR-NEURO-AMI', 'DR-NEURO-VITB'],
    drugSelections: [
      { code: 'DR-NEURO-GABA', selection: 'preferred' },
      { code: 'DR-NEURO-PREGA', selection: 'preferred' },
      { code: 'DR-NEURO-AMI', selection: 'suggested' },
      { code: 'DR-NEURO-VITB', selection: 'recommended' }
    ],
    severity: 'medium',
    warningMessage: 'Tránh lặp lại Đo điện cơ dưới 3 tháng trừ diễn tiến cấp',
    recommendedAction: 'Kiểm tra kết quả lần trước và ghi chú bệnh sử'
  },
  {
    action: 'create-icd-rule-bundle',
    icdCode: 'G63.2',
    icdName: 'Bệnh đa dây thần kinh đái tháo đường',
    chapter: 'Bệnh hệ thần kinh',
    sourceVersion: 'MOH-NEURO-2026',
    protocolName: 'Nội thần kinh ngoại trú',
    protocolStatus: 'active',
    protocolOwner: 'Clinical Council',
    icdRatioMax: 10, clsRatioMax: 25, drugRatioMax: 55,
    clsCodes: ['CLS-DIEN-CO', 'CLS-VIT-B12'],
    clsSelections: [
      { code: 'CLS-DIEN-CO', selection: 'recommended' },
      { code: 'CLS-VIT-B12', selection: 'suggested' }
    ],
    drugCodes: ['DR-NEURO-PREGA', 'DR-NEURO-GABA', 'DR-NEURO-VITB'],
    drugSelections: [
      { code: 'DR-NEURO-PREGA', selection: 'preferred' },
      { code: 'DR-NEURO-GABA', selection: 'preferred' },
      { code: 'DR-NEURO-VITB', selection: 'recommended' }
    ],
    severity: 'high',
    warningMessage: 'Không kết hợp Gabapentin và Pregabalin tránh xuất toán',
    recommendedAction: 'Chỉ chọn một thuốc giảm đau thần kinh'
  },
  {
    action: 'create-icd-rule-bundle',
    icdCode: 'G56.0',
    icdName: 'Hội chứng ống cổ tay',
    chapter: 'Bệnh hệ thần kinh',
    sourceVersion: 'MOH-NEURO-2026',
    protocolName: 'Nội thần kinh ngoại trú',
    protocolStatus: 'active',
    protocolOwner: 'Clinical Council',
    icdRatioMax: 10, clsRatioMax: 25, drugRatioMax: 55,
    clsCodes: ['CLS-DIEN-CO', 'CLS-SA-THAN-KINH', 'TT-CHAM-CUU'],
    clsSelections: [
      { code: 'CLS-DIEN-CO', selection: 'recommended' },
      { code: 'CLS-SA-THAN-KINH', selection: 'recommended' },
      { code: 'TT-CHAM-CUU', selection: 'suggested' }
    ],
    drugCodes: ['DR-NEURO-GABA', 'DR-NEURO-VITB'],
    drugSelections: [
      { code: 'DR-NEURO-GABA', selection: 'suggested' },
      { code: 'DR-NEURO-VITB', selection: 'recommended' }
    ],
    severity: 'low',
    warningMessage: 'Ghi chú đầy đủ định khu tổn thương',
    recommendedAction: ''
  }
];

async function doPush() {
  console.log("Pushing CLS...");
  for (const item of clss) {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).then(r => r.json());
    console.log(item.code, res.ok ? "OK" : "ERROR", res.message || res.error);
  }

  console.log("Pushing Meds...");
  for (const item of meds) {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).then(r => r.json());
    console.log(item.code, res.ok ? "OK" : "ERROR", res.message || res.error);
  }

  console.log("Pushing ICD Bundles...");
  for (const item of bundles) {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).then(r => r.json());
    console.log(item.icdCode, res.ok ? "OK" : "ERROR", res.message || res.error);
  }
  
  console.log("Done pushing everything.");
}

doPush().catch(console.error);

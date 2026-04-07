import { pushToGoogleSheets } from './push-gs-helper.mjs';

const clss = [
  { code: 'CLS-OAE', name: 'Đo âm ốc tai (OAE)', group: 'Thăm dò chức năng', unit: 'lần', defaultFrequency: 'Sàng lọc', sourceRef: 'MOH-PED-2026' },
  { code: 'CLS-ABR', name: 'Đo đáp ứng thính giác thân não (ABR)', group: 'Thăm dò chức năng', unit: 'lần', defaultFrequency: 'Chẩn đoán', sourceRef: 'MOH-PED-2026' },
  { code: 'CLS-DANH-GIA-PT', name: 'Đánh giá phát triển tâm thần vận động', group: 'Thăm dò chức năng', unit: 'lần', defaultFrequency: 'Theo chỉ định', sourceRef: 'MOH-PED-2026' },
  { code: 'CLS-DO-HO-HAP', name: 'Đo chức năng hô hấp Nhi', group: 'Thăm dò chức năng', unit: 'lần', defaultFrequency: 'Theo đợt khám', sourceRef: 'MOH-PED-2026' },
  { code: 'CLS-EEG', name: 'Đo điện não đồ (EEG)', group: 'Thăm dò chức năng', unit: 'lần', defaultFrequency: 'Theo chỉ định', sourceRef: 'MOH-PED-2026' }
];

const meds = [
  { code: 'DR-PED-SALBU', name: 'Salbutamol khí dung', group: 'Giãn phế quản', route: 'Khí dung', strength: 'ống', isBhytCovered: true, sourceRef: 'FORMULARY-PED-2026' },
  { code: 'DR-PED-ICS', name: 'Budesonide khí dung', group: 'Corticoid hít dự phòng', route: 'Khí dung', strength: 'ống', isBhytCovered: true, sourceRef: 'FORMULARY-PED-2026' },
  { code: 'DR-PED-ABX', name: 'Amoxicillin hỗn dịch', group: 'Kháng sinh Nhi', route: 'Uống', strength: 'lọ', isBhytCovered: true, sourceRef: 'FORMULARY-PED-2026' },
  { code: 'DR-PED-H-VALPROATE', name: 'Valproate (NHÓM H)', group: 'Chống co giật', route: 'Uống', strength: 'viên', isBhytCovered: true, sourceRef: 'FORMULARY-PED-H-2026' },
  { code: 'DR-PED-H-METHYLPHEN', name: 'Methylphenidate (NHÓM H)', group: 'Kích thích TK trung ương', route: 'Uống', strength: 'viên', isBhytCovered: true, sourceRef: 'FORMULARY-PED-H-2026' },
  { code: 'DR-PED-H-RISPERIDONE', name: 'Risperidone liều thấp (NHÓM H)', group: 'An thần kinh', route: 'Uống', strength: 'viên', isBhytCovered: true, sourceRef: 'FORMULARY-PED-H-2026' }
];

const bundles = [
  {
    icdCode: 'J06.9', icdName: 'Nhiễm trùng hô hấp trên cấp không đặc hiệu', chapter: 'Bệnh hệ hô hấp',
    sourceVersion: 'MOH-PED-2026', protocolName: 'Nhi khoa ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 20, clsRatioMax: 20, drugRatioMax: 40,
    clsCodes: [], clsSelections: [],
    drugCodes: ['DR-PED-ABX'], drugSelections: [{ code: 'DR-PED-ABX', selection: 'suggested' }],
    severity: 'medium', warningMessage: 'Viêm hô hấp trên đa phần do virus - cảnh báo nếu kê kháng sinh thiếu bằng chứng bội nhiễm', recommendedAction: 'Ghi nhận dấu hiệu bội nhiễm vi khuẩn'
  },
  {
    icdCode: 'J20.9', icdName: 'Viêm phế quản cấp không đặc hiệu', chapter: 'Bệnh hệ hô hấp',
    sourceVersion: 'MOH-PED-2026', protocolName: 'Nhi khoa ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 20, clsRatioMax: 20, drugRatioMax: 40,
    clsCodes: [], clsSelections: [],
    drugCodes: ['DR-PED-ABX'], drugSelections: [{ code: 'DR-PED-ABX', selection: 'suggested' }],
    severity: 'low', warningMessage: '', recommendedAction: ''
  },
  {
    icdCode: 'J45.9', icdName: 'Hen phế quản không đặc hiệu', chapter: 'Bệnh hệ hô hấp',
    sourceVersion: 'MOH-PED-2026', protocolName: 'Nhi khoa ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 15, clsRatioMax: 40, drugRatioMax: 50,
    clsCodes: ['CLS-DO-HO-HAP'], clsSelections: [{ code: 'CLS-DO-HO-HAP', selection: 'recommended' }],
    drugCodes: ['DR-PED-SALBU', 'DR-PED-ICS'], drugSelections: [{ code: 'DR-PED-SALBU', selection: 'standard' }, { code: 'DR-PED-ICS', selection: 'preferred' }],
    severity: 'low', warningMessage: '', recommendedAction: ''
  },
  {
    icdCode: 'G40.9', icdName: 'Động kinh không đặc hiệu', chapter: 'Bệnh hệ thần kinh',
    sourceVersion: 'MOH-PED-2026', protocolName: 'Nhi khoa ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 15, clsRatioMax: 40, drugRatioMax: 50,
    clsCodes: ['CLS-EEG'], clsSelections: [{ code: 'CLS-EEG', selection: 'standard' }],
    drugCodes: ['DR-PED-H-VALPROATE'], drugSelections: [{ code: 'DR-PED-H-VALPROATE', selection: 'standard' }],
    severity: 'high', warningMessage: '⛔ Thuốc nhóm H (Valproate) - Bắt buộc có biên bản hội chẩn hoặc phê duyệt Trưởng khoa trước khi BHYT chấp nhận', recommendedAction: 'Bổ sung biên bản hội chẩn hoặc phiếu duyệt thuốc nhóm H'
  },
  {
    icdCode: 'G80.9', icdName: 'Bại não không đặc hiệu', chapter: 'Bệnh hệ thần kinh',
    sourceVersion: 'MOH-PED-2026', protocolName: 'Nhi khoa ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 15, clsRatioMax: 50, drugRatioMax: 30,
    clsCodes: ['CLS-DANH-GIA-PT', 'CLS-EEG'], clsSelections: [{ code: 'CLS-DANH-GIA-PT', selection: 'recommended' }, { code: 'CLS-EEG', selection: 'suggested' }],
    drugCodes: [], drugSelections: [],
    severity: 'low', warningMessage: '', recommendedAction: ''
  },
  {
    icdCode: 'H90.5', icdName: 'Giảm thính lực cảm giác thần kinh không đặc hiệu', chapter: 'Bệnh tai và xương chũm',
    sourceVersion: 'MOH-PED-2026', protocolName: 'Nhi khoa ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 10, clsRatioMax: 70, drugRatioMax: 10,
    clsCodes: ['CLS-OAE', 'CLS-ABR'], clsSelections: [{ code: 'CLS-OAE', selection: 'standard' }, { code: 'CLS-ABR', selection: 'recommended' }],
    drugCodes: [], drugSelections: [],
    severity: 'low', warningMessage: '', recommendedAction: ''
  },
  {
    icdCode: 'F84.0', icdName: 'Tự kỷ trẻ em', chapter: 'Rối loạn tâm thần và hành vi',
    sourceVersion: 'MOH-PED-2026', protocolName: 'Nhi khoa ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 10, clsRatioMax: 50, drugRatioMax: 50,
    clsCodes: ['CLS-DANH-GIA-PT'], clsSelections: [{ code: 'CLS-DANH-GIA-PT', selection: 'standard' }],
    drugCodes: ['DR-PED-H-RISPERIDONE', 'DR-PED-H-METHYLPHEN'], drugSelections: [{ code: 'DR-PED-H-RISPERIDONE', selection: 'suggested' }, { code: 'DR-PED-H-METHYLPHEN', selection: 'suggested' }],
    severity: 'high', warningMessage: '⛔ Thuốc nhóm H (Risperidone/Methylphenidate) - Bắt buộc phê duyệt Hội đồng Thuốc trước khi sử dụng cho trẻ em', recommendedAction: 'Bổ sung phiếu duyệt thuốc nhóm H và chẩn đoán xác định F84.0'
  },
  {
    icdCode: 'F70', icdName: 'Chậm phát triển trí tuệ mức độ nhẹ', chapter: 'Rối loạn tâm thần và hành vi',
    sourceVersion: 'MOH-PED-2026', protocolName: 'Nhi khoa ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 10, clsRatioMax: 60, drugRatioMax: 20,
    clsCodes: ['CLS-DANH-GIA-PT'], clsSelections: [{ code: 'CLS-DANH-GIA-PT', selection: 'standard' }],
    drugCodes: [], drugSelections: [],
    severity: 'low', warningMessage: '', recommendedAction: ''
  }
];

pushToGoogleSheets({ clss, meds, bundles }).catch(console.error);

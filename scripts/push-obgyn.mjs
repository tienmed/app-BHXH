import { pushToGoogleSheets } from './push-gs-helper.mjs';

const clss = [
  { code: 'CLS-SA-THAI', name: 'Siêu âm thai', group: 'Chẩn đoán hình ảnh', unit: 'lần', defaultFrequency: 'Theo chỉ định', sourceRef: 'MOH-OBGYN-2026' },
  { code: 'CLS-SA-PHU-KHOA', name: 'Siêu âm tử cung phần phụ', group: 'Chẩn đoán hình ảnh', unit: 'lần', defaultFrequency: 'Theo chỉ định', sourceRef: 'MOH-OBGYN-2026' },
  { code: 'CLS-SOI-TUOI', name: 'Soi tươi dịch âm đạo', group: 'Xét nghiệm', unit: 'mẫu', defaultFrequency: 'Khi có triệu chứng', sourceRef: 'MOH-OBGYN-2026' },
  { code: 'CLS-BETA-HCG', name: 'Xét nghiệm định lượng Beta-hCG', group: 'Xét nghiệm', unit: 'mẫu', defaultFrequency: 'Theo chỉ định', sourceRef: 'MOH-OBGYN-2026' },
  { code: 'TT-DAT-VONG', name: 'Thủ thuật đặt DCTC (Đặt vòng)', group: 'Thủ thuật', unit: 'lần', defaultFrequency: 'Khi có nhu cầu', sourceRef: 'MOH-OBGYN-2026' }
];

const meds = [
  { code: 'DR-OBGYN-VIT', name: 'Vitamin thai kỳ (Sắt, Acid Folic, Canxi)', group: 'Vitamin/Khoáng chất', route: 'Uống', strength: 'viên', isBhytCovered: true, sourceRef: 'FORMULARY-OBGYN-2026' },
  { code: 'DR-OBGYN-VAGINAL', name: 'Viên đặt Metronidazole Neomycin', group: 'Kháng sinh phụ khoa', route: 'Đặt âm đạo', strength: 'viên', isBhytCovered: true, sourceRef: 'FORMULARY-OBGYN-2026' },
  { code: 'DR-OBGYN-OCP', name: 'Levonorgestrel/Ethinylestradiol (Thuốc TT hàng ngày)', group: 'Thuốc tránh thai', route: 'Uống', strength: 'viên', isBhytCovered: true, sourceRef: 'FORMULARY-OBGYN-2026' }
];

const bundles = [
  {
    icdCode: 'Z32.1', icdName: 'Có thai, đã được xác nhận', chapter: 'Kỳ thai, sinh đẻ và sau sinh',
    sourceVersion: 'MOH-OBGYN-2026', protocolName: 'Sản Phụ khoa Ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 10, clsRatioMax: 60, drugRatioMax: 30,
    clsCodes: ['CLS-SA-THAI', 'CLS-BETA-HCG'],
    clsSelections: [{ code: 'CLS-SA-THAI', selection: 'recommended' }, { code: 'CLS-BETA-HCG', selection: 'suggested' }],
    drugCodes: ['DR-OBGYN-VIT'], drugSelections: [{ code: 'DR-OBGYN-VIT', selection: 'recommended' }],
    severity: 'medium',
    warningMessage: 'Chỉ định Beta-HCG khi dấu hiệu siêu âm chưa rõ ràng',
    recommendedAction: 'Xem xét kỹ hình ảnh siêu âm 2D trước khi kê định lượng Beta-hCG hoặc tái khám'
  },
  {
    icdCode: 'Z34.9', icdName: 'Giám sát người có thai bình thường', chapter: 'Kỳ thai, sinh đẻ và sau sinh',
    sourceVersion: 'MOH-OBGYN-2026', protocolName: 'Sản Phụ khoa Ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 10, clsRatioMax: 60, drugRatioMax: 30,
    clsCodes: ['CLS-SA-THAI'], clsSelections: [{ code: 'CLS-SA-THAI', selection: 'recommended' }],
    drugCodes: ['DR-OBGYN-VIT'], drugSelections: [{ code: 'DR-OBGYN-VIT', selection: 'recommended' }],
    severity: 'medium',
    warningMessage: 'Tránh lạm dụng siêu âm màu 4D cho những lần khám thai định kỳ dưới 12 tuần',
    recommendedAction: 'Ghi chú tuần thai rõ ràng'
  },
  {
    icdCode: 'N76.0', icdName: 'Viêm âm đạo cấp tính', chapter: 'Bệnh hệ tiết niệu - sinh dục',
    sourceVersion: 'MOH-OBGYN-2026', protocolName: 'Sản Phụ khoa Ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 20, clsRatioMax: 30, drugRatioMax: 50,
    clsCodes: ['CLS-SOI-TUOI', 'CLS-SA-PHU-KHOA'],
    clsSelections: [{ code: 'CLS-SOI-TUOI', selection: 'recommended' }, { code: 'CLS-SA-PHU-KHOA', selection: 'suggested' }],
    drugCodes: ['DR-OBGYN-VAGINAL'], drugSelections: [{ code: 'DR-OBGYN-VAGINAL', selection: 'preferred' }],
    severity: 'low', warningMessage: 'Theo dõi tình trạng viêm tiến triển', recommendedAction: 'Hẹn tái khám sau điều trị'
  },
  {
    icdCode: 'N83.2', icdName: 'Nang buồng trứng khác và không xác định', chapter: 'Bệnh hệ tiết niệu - sinh dục',
    sourceVersion: 'MOH-OBGYN-2026', protocolName: 'Sản Phụ khoa Ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 20, clsRatioMax: 50, drugRatioMax: 30,
    clsCodes: ['CLS-SA-PHU-KHOA', 'CLS-BETA-HCG'],
    clsSelections: [{ code: 'CLS-SA-PHU-KHOA', selection: 'recommended' }, { code: 'CLS-BETA-HCG', selection: 'suggested' }],
    drugCodes: ['DR-OBGYN-OCP'], drugSelections: [{ code: 'DR-OBGYN-OCP', selection: 'suggested' }],
    severity: 'low', warningMessage: 'Cần phân biệt với thai ngoài tử cung', recommendedAction: 'Sử dụng Beta-hCG nếu có nghi ngờ thai'
  },
  {
    icdCode: 'Z30.1', icdName: 'Đưa dụng cụ tránh thai vào tử cung (Đặt vòng)', chapter: 'Kế hoạch hóa gia đình',
    sourceVersion: 'MOH-OBGYN-2026', protocolName: 'Sản Phụ khoa Ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 5, clsRatioMax: 70, drugRatioMax: 25,
    clsCodes: ['TT-DAT-VONG', 'CLS-SA-PHU-KHOA', 'CLS-SOI-TUOI'],
    clsSelections: [{ code: 'TT-DAT-VONG', selection: 'standard' }, { code: 'CLS-SA-PHU-KHOA', selection: 'recommended' }, { code: 'CLS-SOI-TUOI', selection: 'recommended' }],
    drugCodes: ['DR-OBGYN-VAGINAL'], drugSelections: [{ code: 'DR-OBGYN-VAGINAL', selection: 'suggested' }],
    severity: 'high',
    warningMessage: 'Chống chỉ định tuyệt đối thực hiện thủ thuật đặt vòng khi bệnh nhân đang có viêm nhiễm cấp tính đường sinh dục',
    recommendedAction: 'Xem kết quả soi tươi dịch âm đạo và điều trị dứt điểm viêm âm đạo trước khi thực hiện'
  }
];

pushToGoogleSheets({ clss, meds, bundles }).catch(console.error);

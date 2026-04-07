import { pushToGoogleSheets } from './push-gs-helper.mjs';

const clss = [
  { code: 'CLS-THI-LUC', name: 'Đo thị lực khách quan', group: 'Thăm dò chức năng', unit: 'lần', defaultFrequency: 'Theo đợt khám', sourceRef: 'MOH-EYE-2026' },
  { code: 'CLS-NHAN-AP', name: 'Đo nhãn áp', group: 'Thăm dò chức năng', unit: 'lần', defaultFrequency: 'Khám theo dõi', sourceRef: 'MOH-EYE-2026' },
  { code: 'CLS-THI-TRUONG', name: 'Đo phần thị trường', group: 'Thăm dò chức năng', unit: 'lần', defaultFrequency: 'Theo đợt khám', sourceRef: 'MOH-EYE-2026' },
  { code: 'TT-LAY-DI-VAT-MAT', name: 'Lấy dị vật kết mạc nông', group: 'Thủ thuật', unit: 'lần', defaultFrequency: 'Khi có dị vật', sourceRef: 'MOH-EYE-2026' },
  { code: 'CLS-BAN-DO-GM', name: 'Đo bản đồ giác mạc', group: 'Thăm dò chức năng', unit: 'lần', defaultFrequency: 'Theo chỉ định', sourceRef: 'MOH-EYE-2026' },
  { code: 'CLS-KHAM-LAC', name: 'Khám lác đo độ lác', group: 'Thăm dò chức năng', unit: 'lần', defaultFrequency: 'Theo chỉ định', sourceRef: 'MOH-EYE-2026' },
  { code: 'TT-TAP-NHUOC-THI', name: 'Tập nhược thị bằng máy', group: 'Thủ thuật', unit: 'lần', defaultFrequency: 'Theo liệu trình', sourceRef: 'MOH-EYE-2026' }
];

const meds = [
  { code: 'DR-EYE-ABX', name: 'Tobramycin nhỏ mắt', group: 'Kháng sinh nhỏ mắt', route: 'Tra mắt', strength: 'lọ', isBhytCovered: true, sourceRef: 'FORMULARY-EYE-2026' },
  { code: 'DR-EYE-TEAR', name: 'Sodium Hyaluronate 0.1%', group: 'Nước mắt nhân tạo', route: 'Tra mắt', strength: 'lọ', isBhytCovered: true, sourceRef: 'FORMULARY-EYE-2026' },
  { code: 'DR-EYE-GLAUCOMA', name: 'Timolol 0.5%', group: 'Giảm nhãn áp', route: 'Tra mắt', strength: 'lọ', isBhytCovered: true, sourceRef: 'FORMULARY-EYE-2026' },
  { code: 'DR-EYE-PAIN', name: 'Diclofenac nhỏ mắt', group: 'NSAID nhỏ mắt', route: 'Tra mắt', strength: 'lọ', isBhytCovered: true, sourceRef: 'FORMULARY-EYE-2026' },
  { code: 'DR-EYE-DILATOR', name: 'Tropicamide nhỏ mắt', group: 'Giãn đồng tử', route: 'Tra mắt', strength: 'lọ', isBhytCovered: true, sourceRef: 'FORMULARY-EYE-2026' }
];

const bundles = [
  {
    icdCode: 'H10.9', icdName: 'Viêm kết mạc không đặc hiệu', chapter: 'Bệnh về mắt và phần phụ',
    sourceVersion: 'MOH-EYE-2026', protocolName: 'Nhãn khoa ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 15, clsRatioMax: 40, drugRatioMax: 30,
    clsCodes: ['CLS-THI-LUC'], clsSelections: [{ code: 'CLS-THI-LUC', selection: 'recommended' }],
    drugCodes: ['DR-EYE-ABX', 'DR-EYE-TEAR'], drugSelections: [{ code: 'DR-EYE-ABX', selection: 'preferred' }, { code: 'DR-EYE-TEAR', selection: 'recommended' }],
    severity: 'medium', warningMessage: 'Không chỉ định Đo thị trường cho các bệnh viêm nhiễm phần trước của mắt', recommendedAction: 'Chuyển sang đo thị lực khách quan'
  },
  {
    icdCode: 'H40.9', icdName: 'Glôcôm không đặc hiệu', chapter: 'Bệnh về mắt và phần phụ',
    sourceVersion: 'MOH-EYE-2026', protocolName: 'Nhãn khoa ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 20, clsRatioMax: 60, drugRatioMax: 50,
    clsCodes: ['CLS-NHAN-AP', 'CLS-THI-TRUONG'], clsSelections: [{ code: 'CLS-NHAN-AP', selection: 'standard' }, { code: 'CLS-THI-TRUONG', selection: 'standard' }],
    drugCodes: ['DR-EYE-GLAUCOMA', 'DR-EYE-TEAR'], drugSelections: [{ code: 'DR-EYE-GLAUCOMA', selection: 'standard' }, { code: 'DR-EYE-TEAR', selection: 'suggested' }],
    severity: 'high', warningMessage: 'Việc dùng thuốc hạ nhãn áp bắt buộc phải có mã ICD về Glôcôm hoặc kết quả đo > 21mmHg', recommendedAction: 'Đo nhãn áp bổ sung trước khi cấp thuốc'
  },
  {
    icdCode: 'T15.9', icdName: 'Dị vật trên phần ngoài của mắt không xác định', chapter: 'Tổn thương và ngộ độc',
    sourceVersion: 'MOH-EYE-2026', protocolName: 'Nhãn khoa ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 10, clsRatioMax: 70, drugRatioMax: 40,
    clsCodes: ['TT-LAY-DI-VAT-MAT', 'CLS-THI-LUC'], clsSelections: [{ code: 'TT-LAY-DI-VAT-MAT', selection: 'standard' }, { code: 'CLS-THI-LUC', selection: 'suggested' }],
    drugCodes: ['DR-EYE-TEAR', 'DR-EYE-ABX', 'DR-EYE-PAIN'], drugSelections: [{ code: 'DR-EYE-TEAR', selection: 'preferred' }, { code: 'DR-EYE-ABX', selection: 'recommended' }, { code: 'DR-EYE-PAIN', selection: 'suggested' }],
    severity: 'low', warningMessage: '', recommendedAction: ''
  },
  {
    icdCode: 'H52.2', icdName: 'Loạn thị', chapter: 'Bệnh về mắt và phần phụ',
    sourceVersion: 'MOH-EYE-2026', protocolName: 'Nhãn khoa ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 15, clsRatioMax: 60, drugRatioMax: 20,
    clsCodes: ['CLS-THI-LUC', 'CLS-BAN-DO-GM'], clsSelections: [{ code: 'CLS-THI-LUC', selection: 'standard' }, { code: 'CLS-BAN-DO-GM', selection: 'recommended' }],
    drugCodes: ['DR-EYE-DILATOR'], drugSelections: [{ code: 'DR-EYE-DILATOR', selection: 'suggested' }],
    severity: 'medium', warningMessage: 'Đo bản đồ giác mạc ưu tiên cho bệnh nhân loạn thị (H52.2) hoặc chuẩn bị phẫu thuật', recommendedAction: 'Chỉ định linh hoạt chỉ khi chênh lệch khúc xạ đột ngột'
  },
  {
    icdCode: 'H53.0', icdName: 'Nhược thị do mất thị giác', chapter: 'Bệnh về mắt và phần phụ',
    sourceVersion: 'MOH-EYE-2026', protocolName: 'Nhãn khoa ngoại trú', protocolStatus: 'active', protocolOwner: 'Clinical Council',
    icdRatioMax: 10, clsRatioMax: 70, drugRatioMax: 10,
    clsCodes: ['TT-TAP-NHUOC-THI', 'CLS-THI-LUC'], clsSelections: [{ code: 'TT-TAP-NHUOC-THI', selection: 'standard' }, { code: 'CLS-THI-LUC', selection: 'recommended' }],
    drugCodes: ['DR-EYE-TEAR'], drugSelections: [{ code: 'DR-EYE-TEAR', selection: 'suggested' }],
    severity: 'low', warningMessage: 'Tập nhược thị có kết quả thấp ở độ tuổi trên 12', recommendedAction: 'Yêu cầu có giải trình BHYT rõ ràng mục tiêu hồi phục'
  }
];

pushToGoogleSheets({ clss, meds, bundles }).catch(console.error);

import fs from 'fs';
import path from 'path';

const seedsDir = process.cwd();

function appendToCsv(filename, row) {
  const filepath = path.join(seedsDir, filename);
  const escape = (val) => {
    let s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const line = row.map(escape).join(",");
  fs.appendFileSync(filepath, "\n" + line, "utf-8");
  console.log(`Appended to ${filename}`);
}

// 1. catalog_icd.csv
appendToCsv('catalog_icd.csv', ["E05.9", "Nhiễm độc giáp không đặc hiệu (Cường giáp)", "Bệnh nội tiết dinh dưỡng và chuyển hóa", "TRUE", "2026-01-01", "2099-12-31", "MOH-ENDOC-2026"]);
appendToCsv('catalog_icd.csv', ["E03.9", "Suy giáp không đặc hiệu", "Bệnh nội tiết dinh dưỡng và chuyển hóa", "TRUE", "2026-01-01", "2099-12-31", "MOH-ENDOC-2026"]);
appendToCsv('catalog_icd.csv', ["E04.9", "Bướu cổ không độc không đặc hiệu", "Bệnh nội tiết dinh dưỡng và chuyển hóa", "TRUE", "2026-01-01", "2099-12-31", "MOH-ENDOC-2026"]);
appendToCsv('catalog_icd.csv', ["E21.3", "Cường tuyến cận giáp", "Bệnh nội tiết dinh dưỡng và chuyển hóa", "TRUE", "2026-01-01", "2099-12-31", "MOH-ENDOC-2026"]);
appendToCsv('catalog_icd.csv', ["E20.9", "Suy tuyến cận giáp", "Bệnh nội tiết dinh dưỡng và chuyển hóa", "TRUE", "2026-01-01", "2099-12-31", "MOH-ENDOC-2026"]);

// 2. catalog_cls.csv
appendToCsv('catalog_cls.csv', ["CLS-XN-TSH", "Xét nghiệm định lượng TSH", "Xét nghiệm", "mẫu", "TRUE", "MOH-ENDOC-2026", "Tầm soát chức năng tuyến giáp", "Cường giáp, Suy giáp", 30, "FALSE", "UNKNOWN"]);
appendToCsv('catalog_cls.csv', ["CLS-XN-FT4", "Xét nghiệm định lượng FT4", "Xét nghiệm", "mẫu", "TRUE", "MOH-ENDOC-2026", "Chẩn đoán xác định cường/suy giáp", "Khi TSH bất thường", 30, "FALSE", "UNKNOWN"]);
appendToCsv('catalog_cls.csv', ["CLS-CDHA-SA-TUYEN-GIAP", "Siêu âm tuyến giáp", "Chẩn đoán hình ảnh", "lần", "TRUE", "MOH-ENDOC-2026", "Phát hiện nhân giáp, nang, bướu", "Sờ thấy u vùng cổ", 180, "FALSE", "UNKNOWN"]);
appendToCsv('catalog_cls.csv', ["CLS-XN-PTH", "Xét nghiệm Hormon tuyến cận giáp (PTH)", "Xét nghiệm", "mẫu", "TRUE", "MOH-ENDOC-2026", "Đánh giá chức năng cận giáp", "Loãng xương nặng, rối loạn canxi", 90, "FALSE", "UNKNOWN"]);
appendToCsv('catalog_cls.csv', ["CLS-XN-CANXI-ION", "Xét nghiệm Canxi i-on hóa", "Xét nghiệm", "mẫu", "TRUE", "MOH-ENDOC-2026", "Đánh giá rối loạn chuyển hóa canxi", "Bệnh cận giáp", 30, "FALSE", "UNKNOWN"]);

// 3. catalog_medication.csv
appendToCsv('catalog_medication.csv', ["MED-ENDOC-LEVOTHYROXINE", "Levothyroxine", "Hormon tuyến giáp", "Uống", "50mcg", "TRUE", "TRUE", "FORMULARY-ENDOC-2026", "Thay thế hormon trong Suy giáp", "Cường giáp do quá liều", "Sắt/Canxi làm giảm hấp thu", 30, 30, "CLS-XN-TSH", ""]);
appendToCsv('catalog_medication.csv', ["MED-ENDOC-THIAMAZOLE", "Thiamazole", "Kháng giáp tổng hợp", "Uống", "5mg", "TRUE", "TRUE", "FORMULARY-ENDOC-2026", "Ức chế tổng hợp hormon trong Cường giáp", "Viêm gan, Giảm bạch cầu hạt", "Thuốc ngừa thai", 30, 90, "CLS-XN-AST-ALT", ""]);

// 4. mapping_icd_cls.csv
appendToCsv('mapping_icd_cls.csv', ["E05.9", "CLS-XN-TSH", "recommended", 1, "Mục đích: Khẳng định trạng thái ức chế TSH trong cường giáp và theo dõi đáp ứng điều trị.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["E05.9", "CLS-XN-FT4", "recommended", 2, "Mục đích: Chẩn đoán mức độ nhiễm độc giáp.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["E05.9", "CLS-CDHA-SA-TUYEN-GIAP", "suggested", 3, "Mục đích: Đánh giá thể tích tuyến giáp lượng máu tăng trong Basedow. Hạn chế lặp lại.", "IIa"]);

appendToCsv('mapping_icd_cls.csv', ["E03.9", "CLS-XN-TSH", "recommended", 1, "Mục đích: Đánh giá mục tiêu điều trị thay thế hormone.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["E03.9", "CLS-XN-FT4", "suggested", 2, "Mục đích: Đánh giá cường độ chức năng tuyến.", "IIa"]);

appendToCsv('mapping_icd_cls.csv', ["E04.9", "CLS-CDHA-SA-TUYEN-GIAP", "recommended", 1, "Mục đích: Xác định kích thước, phân loại (TIRADS). Lặp lại tối thiểu 6 tháng.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["E04.9", "CLS-XN-TSH", "recommended", 2, "Mục đích: Loại trừ suy giáp hoặc cường giáp ẩn kèm bướu.", "I"]);

appendToCsv('mapping_icd_cls.csv', ["E21.3", "CLS-XN-PTH", "recommended", 1, "Mục đích: Chẩn đoán và theo dõi cường cận giáp.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["E21.3", "CLS-XN-CANXI-ION", "recommended", 2, "Mục đích: Xác định mức tăng canxi huyết.", "I"]);

appendToCsv('mapping_icd_cls.csv', ["E20.9", "CLS-XN-PTH", "recommended", 1, "Mục đích: Xác định mức giảm PTH do suy tuyến.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["E20.9", "CLS-XN-CANXI-ION", "recommended", 2, "Mục đích: Đánh giá nguy cơ hạ canxi cấp.", "I"]);

// 5. mapping_icd_medication.csv
appendToCsv('mapping_icd_medication.csv', ["E05.9", "MED-ENDOC-THIAMAZOLE", "recommended", 1, "Mục đích: Khống chế tổng hợp hormone giáp.", "I"]);
appendToCsv('mapping_icd_medication.csv', ["E05.9", "MED-BB-BISOPROLOL", "suggested", 2, "Mục đích: Giảm nhịp tim nhanh do cường giao cảm trước khi Thiamazole có tác dụng.", "IIa"]);

appendToCsv('mapping_icd_medication.csv', ["E03.9", "MED-ENDOC-LEVOTHYROXINE", "recommended", 1, "Mục đích: Hormone thay thế bắt buộc.", "I"]);

// 6. rule_claim_risk.csv
appendToCsv('rule_claim_risk.csv', [
  "RISK-ENDOC-04", "Giám sát an toàn thuốc Kháng Giáp", "high", "E05.9", "", "MED-ENDOC-THIAMAZOLE",
  "Thuốc Thiamazole có rủi ro hiếm gặp gây giảm bạch cầu hạt hoặc suy gan. Khi kê kéo dài bắt buộc phải có xét nghiệm ALT/AST hoặc Công thức máu để định kỳ rà soát.",
  "Chỉ định xét nghiệm Máu rà soát chức năng gan.", "",
  "MISSING_REQUIRED_EVIDENCE", "CLS-XN-AST-ALT", "TRUE"
]);

appendToCsv('rule_claim_risk.csv', [
  "RISK-ENDOC-05", "Siêu âm tuyến giáp lạm dụng thường quy", "medium", "E04.9|E05.9|E03.9", "CLS-CDHA-SA-TUYEN-GIAP", "",
  "Siêu âm tuyến giáp không mang dấu hiệu tiến triển ác tính (TIRADS thấp) chỉ nên lặp lại tối thiểu mỗi 6 tháng (180 ngày). Việc siêu âm liên tục mỗi tháng tại PK sẽ bị xuất toán.",
  "Từ chối chỉ định hoặc ghi rõ yếu tố nghi ngờ tiến triển.", "",
  "REPEAT_INTERVAL_VIOLATION", "180", "TRUE"
]);

appendToCsv('rule_claim_risk.csv', [
  "RISK-ENDOC-06", "Levothyroxine không có test TSH", "high", "E03.9", "", "MED-ENDOC-LEVOTHYROXINE",
  "Kê đơn hormone giáp quá liều gây cường giáp thứ phát chuyển dòng, vì thế bắt buộc có xét nghiệm TSH đi kèm để chỉnh liều ngoại trú.",
  "Bổ sung xét nghiệm TSH.", "",
  "MISSING_REQUIRED_EVIDENCE", "CLS-XN-TSH", "TRUE"
]);

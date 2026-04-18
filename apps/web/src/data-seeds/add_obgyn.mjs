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
// icd_code,icd_name,chapter,is_active,effective_from,effective_to,source_ref
appendToCsv('catalog_icd.csv', ["D25.9", "U cơ trơn tử cung (U xơ tử cung) không xác định", "Khối u (Tân sinh)", "TRUE", "2026-01-01", "2099-12-31", "MOH-OBGYN-2026"]);
appendToCsv('catalog_icd.csv', ["N92.0", "Kinh nguyệt quá nhiều và thường xuyên (Rong kinh)", "Bệnh hệ tiết niệu - sinh dục", "TRUE", "2026-01-01", "2099-12-31", "MOH-OBGYN-2026"]);
appendToCsv('catalog_icd.csv', ["N70.9", "Viêm vòi trứng và buồng trứng (Viêm phần phụ)", "Bệnh hệ tiết niệu - sinh dục", "TRUE", "2026-01-01", "2099-12-31", "MOH-OBGYN-2026"]);

// 2. mapping_icd_cls.csv
// icd_code,cls_code,mapping_type,priority,note,evidence_level
appendToCsv('mapping_icd_cls.csv', ["D25.9", "CLS-CDHA-SA-PHU-KHOA", "recommended", 1, "Mục đích: Siêu âm đo kích thước và vị trí u xơ, theo dõi sự phát triển hoặc nghi ngờ ác tính.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["D25.9", "CLS-XN-CONG-THUC-MAU", "suggested", 2, "Mục đích: Đánh giá tình trạng thiếu máu thứ phát do rong kinh từ u xơ tử cung.", "IIa"]);

appendToCsv('mapping_icd_cls.csv', ["N92.0", "CLS-CDHA-SA-PHU-KHOA", "recommended", 1, "Mục đích: Sàng lọc dị dạng tử cung, khối u thực thể gây chảy máu (u xơ/polyp).", "I"]);
appendToCsv('mapping_icd_cls.csv', ["N92.0", "CLS-XN-CONG-THUC-MAU", "recommended", 2, "Mục đích: Đánh giá mức độ thiếu máu và định hướng bù sắt — bắt buộc phải làm khi nghi ngờ thiếu máu do rong kinh.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["N92.0", "CLS-XN-BETA-HCG", "recommended", 3, "Mục đích: Tầm soát và loại trừ có thai / thai ngoài tử cung / sảy thai trước khi điều trị (ACOG).", "I"]);

appendToCsv('mapping_icd_cls.csv', ["N70.9", "CLS-CDHA-SA-PHU-KHOA", "recommended", 1, "Mục đích: Sàng lọc tràn dịch ống dẫn trứng và áp-xe phần phụ.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["N70.9", "CLS-XN-SOI-TUOI", "recommended", 2, "Mục đích: Soi tươi âm đạo xác định tác nhân vi sinh (nấm/tạp khuẩn/lậu/chlamydia) để chỉ định kháng sinh đích.", "I"]);

// 3. mapping_icd_medication.csv
// icd_code,drug_code,mapping_type,priority,note,evidence_level
appendToCsv('mapping_icd_medication.csv', ["D25.9", "MED-OBGYN-CONTRACEPTIVE", "suggested", 1, "Mục đích: Tránh thai hằng ngày hỗ trợ điều hòa chu kỳ kinh và giảm chảy máu trong u xơ (nếu không chống chỉ định). Tác dụng phụ: Tăng cân nhẹ, đau ngực. Tương tác: Kháng sinh phổ rộng.", "IIa"]);
appendToCsv('mapping_icd_medication.csv', ["D25.9", "MED-NSAID-IBUPROFEN", "suggested", 2, "Mục đích: Giảm đau bụng kinh và giảm chảy máu kinh nguyệt ở bệnh nhân u xơ. Tác dụng phụ: Loét dạ dày. Tương tác: Thận trọng cho người bệnh thận.", "IIa"]);

appendToCsv('mapping_icd_medication.csv', ["N92.0", "MED-OBGYN-CONTRACEPTIVE", "preferred", 1, "Mục đích: Liệu pháp nội tiết tố đường uống (viên kết hợp) là điều trị nội khoa đầu tay cho rong kinh vô căn (ACOG). Tác dụng phụ: Căng ngực, buồn nôn.", "I"]);
appendToCsv('mapping_icd_medication.csv', ["N92.0", "MED-NSAID-IBUPROFEN", "recommended", 2, "Mục đích: NSAID giúp giảm 20-50% lượng máu mất trong kỳ kinh. Tác dụng phụ: Dạ dày.", "I"]);

appendToCsv('mapping_icd_medication.csv', ["N70.9", "MED-OBGYN-METRO-NEO", "preferred", 1, "Mục đích: Viên đặt kháng sinh phổ rộng tác dụng trên vi khuẩn kỵ khí và gram âm cho viêm nhiễm phần phụ mức độ nhẹ ngoại trú. Tác dụng phụ: Rát vùng kín. Tương tác: Không rửa âm đạo quá sâu.", "I"]);

// 4. rule_claim_risk.csv
// rule_code,rule_name,severity,applies_to_icd,applies_to_cls,applies_to_drug,warning_message,recommended_action,condition_expression,condition_type,condition_parameter,is_active
appendToCsv('rule_claim_risk.csv', [
  "RISK-OBGYN-06", "Bệnh Rong kinh cần xác nhận loại trừ thai", "high", "N92.0", "", "",
  "Phụ nữ tuổi sinh sản khi chẩn đoán Rong kinh / Xuất huyết bất thường (N92.0) cần làm xét nghiệm Beta-hCG để loại trừ thai ngoài tử cung hoặc doạ sảy thai.",
  "Chỉ định Xét nghiệm Beta-hCG định lượng hoặc thử thai nhanh (nếu chưa có).", "",
  "MISSING_REQUIRED_EVIDENCE", "CLS-XN-BETA-HCG", "TRUE"
]);

appendToCsv('rule_claim_risk.csv', [
  "RISK-OBGYN-07", "Siêu âm tầm soát U Xơ tử cung", "medium", "D25.9", "", "",
  "Bệnh nhân có theo dõi U xơ tử cung cần chỉ định siêu âm tử cung - phần phụ tối thiểu mỗi 6 tháng để theo dõi tốc độ phát triển kích thước khối u.",
  "Chỉ định siêu âm phụ khoa nếu kết quả gần nhất > 6 tháng.", "",
  "REPEAT_INTERVAL_VIOLATION", "180", "TRUE"
]);


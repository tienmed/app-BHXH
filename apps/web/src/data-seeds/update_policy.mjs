import fs from 'fs';
import path from 'path';

const seedsDir = process.cwd();

// 1. Remove TPCN from medication and mapping
function removeRow(filename, searchStr) {
  const filepath = path.join(seedsDir, filename);
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');
  const filtered = lines.filter(line => !line.includes(searchStr));
  fs.writeFileSync(filepath, filtered.join('\n'), 'utf8');
  console.log(`Removed ${searchStr} from ${filename}. Removed ${lines.length - filtered.length} lines.`);
}

removeRow('catalog_medication.csv', 'MED-OBGYN-EVENING-PRIMROSE');
removeRow('mapping_icd_medication.csv', 'MED-OBGYN-EVENING-PRIMROSE');

// 2. Append new VLTL/YHCT and Screening Rules
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

// Add VLTL/YHCT mappings for back pain, sciatica, spondylosis
// mapping_type, priority, source_version, note, evidence_level
appendToCsv('mapping_icd_cls.csv', ["M54.5", "PHCN-VAT-LY-TL", "recommended", 3, "Mục đích: Vật lý trị liệu (kéo giãn/nhiệt trị liệu) giảm đau thắt lưng cơ năng/mạn tính. Thúc đẩy liên kết IPE đa chuyên khoa.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["M54.5", "TT-CHAM-CUU", "suggested", 4, "Mục đích: Châm cứu YHCT điều trị đau vùng thắt lưng, bổ trợ tối ưu theo mô hình BS Gia đình.", "IIa"]);

appendToCsv('mapping_icd_cls.csv', ["M54.3", "PHCN-VAT-LY-TL", "recommended", 4, "Mục đích: Giảm chèn ép rễ thần kinh tọa và phục hồi tầm vận động.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["M54.3", "TT-CHAM-CUU", "suggested", 5, "Mục đích: Giảm đau thần kinh tọa bằng YHCT theo hướng dẫn phối hợp đa mô thức.", "IIa"]);

appendToCsv('mapping_icd_cls.csv', ["M47.8", "PHCN-VAT-LY-TL", "recommended", 3, "Mục đích: Duy trì tầm vận động cột sống thoái hóa.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["I69.4", "PHCN-VAT-LY-TL", "recommended", 8, "Mục đích: Phục hồi chức năng vận động sau đột quỵ (liệt nửa người). Rất quan trọng trong chăm sóc chủ động.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["I69.4", "TT-CHAM-CUU", "suggested", 9, "Mục đích: Châm cứu phục hồi cơ lực sau đột quỵ.", "IIa"]);

// Add Screening Abuse Rule
// rule_code,rule_name,severity,applies_to_icd,applies_to_cls,applies_to_drug,warning_message,recommended_action,condition_expression,condition_type,condition_parameter,is_active
appendToCsv('rule_claim_risk.csv', [
  "RISK-GLOBAL-01", "Cấm lạm dụng CLS Cận lâm sàng để Tầm soát", "high", "", "CLS-CDHA-MRI-SO-NAO|CLS-CDHA-CT-SO-NAO|CLS-XN-TROPONIN|CLS-CDHA-MRI-CS|CLS-TDCN-NOI-SOI-DD|CLS-TDCN-NOI-SOI-DT", "",
  "Tuyệt đối không sử dụng các kỹ thuật đắt tiền hoặc xâm lấn (Nội soi, MRI, CT) để tầm soát diện rộng (Screening) khi bệnh nhân không có triệu chứng chỉ điểm rõ ràng. BHXH sẽ xuất toán ngay lập tức các ca tầm soát không lý do y khoa.",
  "Chuyển sang gói Khám Sức Khỏe Thu Phí Tự Nguyện nếu bệnh nhân muốn tầm soát chưa có bệnh.", "",
  "ILLEGAL_SCREENING", "", "TRUE"
]);

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
appendToCsv('catalog_icd.csv', ["N60.9", "Loạn sản vú lành tính không đặc hiệu", "Bệnh hệ sinh dục tiết niệu", "TRUE", "2026-01-01", "2099-12-31", "MOH-BREAST-2026"]);
appendToCsv('catalog_icd.csv', ["N61", "Các rối loạn viêm của vú", "Bệnh hệ sinh dục tiết niệu", "TRUE", "2026-01-01", "2099-12-31", "MOH-BREAST-2026"]);
appendToCsv('catalog_icd.csv', ["N63", "Khối u không xác định ở vú", "Bệnh hệ sinh dục tiết niệu", "TRUE", "2026-01-01", "2099-12-31", "MOH-BREAST-2026"]);
appendToCsv('catalog_icd.csv', ["D24", "U mềm lành tính của vú (U xơ vú)", "Khối u", "TRUE", "2026-01-01", "2099-12-31", "MOH-BREAST-2026"]);

// 2. catalog_cls.csv
appendToCsv('catalog_cls.csv', ["CLS-CDHA-SA-TUYEN-VU", "Siêu âm tuyến vú (2 bên)", "Chẩn đoán hình ảnh", "lần", "TRUE", "MOH-BREAST-2026", "Đánh giá cấu trúc nhu mô vú, phát hiện nang/u xơ/áp xe", "Khi có cục u sờ thấy hoặc đau vú", 180, "FALSE", "UNKNOWN"]);
appendToCsv('catalog_cls.csv', ["CLS-CDHA-XQUANG-VU", "Chụp X-quang tuyến vú hai bên (Mammography)", "Chẩn đoán hình ảnh", "lần", "TRUE", "MOH-BREAST-2026", "Tầm soát vi vôi hóa phát hiện sớm ung thư vú", "Tầm soát phụ nữ > 40 tuổi hoặc khối u nghi ngờ", 365, "TRUE", "UNKNOWN"]);
appendToCsv('catalog_cls.csv', ["CLS-TDCN-FNA-VU", "Chọc hút tế bào khối u vú bằng kim nhỏ (FNA)", "Thủ thuật", "lần", "TRUE", "MOH-BREAST-2026", "Xác định bản chất tế bào khối u vú (ác/lành)", "Siêu âm có khối u nghi ngờ (BIRADS >= 3)", 90, "TRUE", "UNKNOWN"]);

// 3. catalog_medication.csv
appendToCsv('catalog_medication.csv', ["MED-OBGYN-EVENING-PRIMROSE", "Dầu hoa anh thảo (Evening Primrose Oil)", "Thực phẩm chức năng", "Uống", "1000mg", "FALSE", "TRUE", "FORMULARY-BREAST-2026", "Hỗ trợ giảm đau căng tức ngực chu kỳ", "Buồn nôn nhẹ", "Thuốc chống đông", 60, 60, "", ""]);

// 4. mapping_icd_cls.csv
appendToCsv('mapping_icd_cls.csv', ["N60.9", "CLS-CDHA-SA-TUYEN-VU", "recommended", 1, "Mục đích: Đánh giá mảng sợi bọc/nang nước. Lặp lại 6 tháng.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["N61", "CLS-CDHA-SA-TUYEN-VU", "recommended", 1, "Mục đích: Khảo sát ổ áp xe hóa để chích rạch nếu cần.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["N63", "CLS-CDHA-SA-TUYEN-VU", "recommended", 1, "Mục đích: Phân loại BIRADS khối u không xác định.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["N63", "CLS-CDHA-XQUANG-VU", "suggested", 2, "Mục đích: Phối hợp siêu âm để tăng độ nhạy ác tính (người lớn tuổi).", "I"]);
appendToCsv('mapping_icd_cls.csv', ["N63", "CLS-TDCN-FNA-VU", "suggested", 3, "Mục đích: Chọc hút định danh tế bào u nếu siêu âm trả kết quả nghi ngờ BIRADS cao.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["D24", "CLS-CDHA-SA-TUYEN-VU", "recommended", 1, "Mục đích: Siêu âm đo kích thước u xơ. Không lặp lại dưới 6 tháng.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["D24", "CLS-TDCN-FNA-VU", "suggested", 2, "Mục đích: Khẳng định u xơ lành tính (làm 1 lần đầu).", "I"]);

// 5. mapping_icd_medication.csv
appendToCsv('mapping_icd_medication.csv', ["N60.9", "MED-OBGYN-EVENING-PRIMROSE", "suggested", 1, "Mục đích: Giảm đau vú chu kỳ do loạn sản.", "IIa"]);
appendToCsv('mapping_icd_medication.csv', ["N61", "MED-ABX-AMOX-CLAV", "recommended", 1, "Mục đích: Kháng sinh phổ rộng trị nhiễm trùng mô mềm/áp xe vú.", "I"]);

// 6. rule_claim_risk.csv
appendToCsv('rule_claim_risk.csv', [
  "RISK-BREAST-01", "Siêu âm tuyến vú lặp lại quá mức", "medium", "N60.9|D24", "CLS-CDHA-SA-TUYEN-VU", "",
  "Việc siêu âm theo dõi mảng thay đổi sợi bọc (N60.9) hoặc u xơ lành tính (D24) thuộc BIRADS 1-2 chỉ nên thực hiện tần suất 6 tháng (180 ngày). Nếu dưới mức này BHYT sẽ soi xuất toán.",
  "Từ chối chỉ định bằng BHYT, tư vấn chuyển bệnh nhân sang gói thu phí dịch vụ tự trả nếu kiên quyết làm sớm.", "",
  "REPEAT_INTERVAL_VIOLATION", "180", "TRUE"
]);

appendToCsv('rule_claim_risk.csv', [
  "RISK-BREAST-02", "Lạm dụng chụp Nhũ ảnh", "high", "N60.9|D24|N63", "CLS-CDHA-XQUANG-VU", "",
  "Chụp X-quang tuyến vú có sử dụng tia bức xạ, chống chỉ định lặp lại dưới 1 năm. Việc chỉ định lạm dụng gây nhiễm xạ cho bệnh nhân và lãng phí BHYT.",
  "Xóa chỉ định X-quang vú. Nếu cần chẩn đoán sớm hãy chuyển sang Siêu âm.", "",
  "REPEAT_INTERVAL_VIOLATION", "365", "TRUE"
]);

appendToCsv('rule_claim_risk.csv', [
  "RISK-BREAST-03", "Chọc hút FNA chưa đủ dữ liệu siêu âm", "high", "N63|D24", "CLS-TDCN-FNA-VU", "",
  "Chọc hút tế bào cắm kim sâu chỉ được làm với u đặc có kích thước xác định hoặc BIRADS > 3 trên siêu âm. Làm FNA mù khơi mà không có căn cứ siêu âm sẽ bị từ chối thanh toán.",
  "Bắt buộc hoàn tất chỉ định CLS Siêu âm vú trước khi can thiệp FNA.", "",
  "MISSING_REQUIRED_EVIDENCE", "CLS-CDHA-SA-TUYEN-VU", "TRUE"
]);

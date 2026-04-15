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
appendToCsv('catalog_icd.csv', ["I25.1", "Bệnh tim thiếu máu cục bộ mạn tính", "Bệnh hệ tuần hoàn", "TRUE", "2026-01-01", "2099-12-31", "MOH-CARDIO-2026"]);
appendToCsv('catalog_icd.csv', ["I83.9", "Giãn tĩnh mạch chi dưới (Không loét viêm)", "Bệnh hệ tuần hoàn", "TRUE", "2026-01-01", "2099-12-31", "MOH-CARDIO-2026"]);
appendToCsv('catalog_icd.csv', ["I11.9", "Bệnh tim do tăng huyết áp (Không suy tim)", "Bệnh hệ tuần hoàn", "TRUE", "2026-01-01", "2099-12-31", "MOH-CARDIO-2026"]);
appendToCsv('catalog_icd.csv', ["I65.2", "Tắc nghẽn và hẹp động mạch cảnh", "Bệnh hệ tuần hoàn", "TRUE", "2026-01-01", "2099-12-31", "MOH-CARDIO-2026"]);

// 2. catalog_cls.csv
// cls_code,cls_name,cls_group,unit,is_active,source_ref,clinical_purpose,indication_criteria,min_repeat_interval_days,requires_red_flag,restricted_specialty
appendToCsv('catalog_cls.csv', ["CLS-CDHA-DOPPLER-TIM", "Siêu âm Doppler màu tim", "Chẩn đoán hình ảnh", "lần", "TRUE", "MOH-CARDIO-2026", "Đánh giá hình thái, chức năng bơm máu (EF), và van tim.", "Tầm soát suy tim, khảo sát bệnh lý van tim, theo dõi mạn tính.", 180, "FALSE", "CARDIO"]);
appendToCsv('catalog_cls.csv', ["CLS-CDHA-DOPPLER-CHI", "Siêu âm Doppler mạch máu chi dưới", "Chẩn đoán hình ảnh", "lần", "TRUE", "MOH-CARDIO-2026", "Phát hiện suy giãn tĩnh mạch, mảng xơ vữa hoặc huyết khối.", "Phù nề chân, đau cách hồi, giãn tĩnh mạch ngoại biên.", 365, "FALSE", "UNKNOWN"]);
appendToCsv('catalog_cls.csv', ["CLS-CDHA-DOPPLER-CANH", "Siêu âm Doppler động mạch cảnh", "Chẩn đoán hình ảnh", "lần", "TRUE", "MOH-CARDIO-2026", "Khảo sát hẹp tắc hệ tĩnh mạch cảnh cung cấp máu não.", "Bệnh nhân có TIA (G45.9), Hẹp cảnh (I65.2) hoặc theo dõi xơ vữa.", 365, "FALSE", "UNKNOWN"]);

// 3. catalog_medication.csv
// drug_code,drug_name,drug_group,route,strength,is_bhyt_covered,is_active,source_ref,therapeutic_purpose,side_effects,drug_interactions,max_duration_days,max_quantity_per_rx,requires_monitoring_cls,contraindicated_icd
appendToCsv('catalog_medication.csv', ["MED-CARDIO-ASPIRIN", "Aspirin", "Kháng kết tập tiểu cầu", "Uống", "81mg", "TRUE", "TRUE", "FORMULARY-CARDIO-2026", "Phòng ngừa huyết khối do xơ vữa.", "Dạ dày tá tràng, Chảy máu.", "NSAID tăng viêm loét.", 30, 30, "", "K25.9|K26.9"]);
appendToCsv('catalog_medication.csv', ["MED-BB-BISOPROLOL", "Bisoprolol", "Chẹn Beta", "Uống", "2.5mg", "TRUE", "TRUE", "FORMULARY-CARDIO-2026", "Kiểm soát nhịp tim, giảm tải cho tim ở bệnh nhân THA và Suy tim/Mạch vành.", "Nhịp tim quá chậm, Mệt mỏi.", "Thuốc hen suyễn/COPD.", 30, 30, "CLS-TDCN-ECG-12", "J44.9|J45.9"]);
appendToCsv('catalog_medication.csv', ["MED-VASC-DIOSMIN", "Diosmin/Hesperidin (Daflon)", "Bền vững thành mạch", "Uống", "500mg", "TRUE", "TRUE", "FORMULARY-CARDIO-2026", "Điều trị triệu chứng của bệnh giãn tĩnh mạch vô căn hoặc trĩ.", "Rối loạn tiêu hóa nhẹ.", "Không rõ ràng.", 30, 60, "", ""]);

// 4. mapping_icd_cls.csv
// icd_code,cls_code,mapping_type,priority,note,evidence_level
appendToCsv('mapping_icd_cls.csv', ["I25.1", "CLS-TDCN-ECG-12", "recommended", 1, "Mục đích: Khảo sát nhịp và thiếu máu cơ tim. Ưu tiên: Đầu tay mọi ca mạch vành. Lặp lại: Mỗi lần tái khám (6 tháng).", "I"]);
appendToCsv('mapping_icd_cls.csv', ["I25.1", "CLS-CDHA-DOPPLER-TIM", "recommended", 2, "Mục đích: Đánh giá chức năng thất trái bơm máu (EF). Ưu tiên: Ca đã có triệu chứng suy tim. Lặp lại: 6 tháng/lần.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["I25.1", "CLS-XN-LIPID", "recommended", 3, "Mục đích: Đánh giá nồng độ LDL-C điều hướng dùng Statin liều cao. Ưu tiên: Bắt buộc. Lặp lại: 3-6 tháng.", "I"]);

appendToCsv('mapping_icd_cls.csv', ["I83.9", "CLS-CDHA-DOPPLER-CHI", "recommended", 1, "Mục đích: Khảo sát tĩnh mạch nông và sâu phát hiện dòng trào ngược. Ưu tiên: Lần đầu chẩn đoán. Lặp lại: 1 năm/lần.", "I"]);

appendToCsv('mapping_icd_cls.csv', ["I11.9", "CLS-CDHA-DOPPLER-TIM", "recommended", 1, "Mục đích: Siêu âm kiểm tra phì đại thất trái do biến chứng THA (Target organ damage). Ưu tiên: Khám tầm soát THA mạn tính. Lặp lại: 6 tháng.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["I11.9", "CLS-TDCN-ECG-12", "recommended", 2, "Mục đích: Khảo sát dày thất trái (Sokolow-Lyon). Ưu tiên: Khám định kỳ. Lặp lại: 6 tháng.", "I"]);

appendToCsv('mapping_icd_cls.csv', ["I65.2", "CLS-CDHA-DOPPLER-CANH", "recommended", 1, "Mục đích: Xác định mức độ hẹp mảng xơ vữa (Dưới 50% / Trên 70%). Ưu tiên: Siêu âm theo dõi bắt buộc. Lặp lại: 6-12 tháng.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["I65.2", "CLS-XN-LIPID", "recommended", 2, "Mục đích: Theo dõi và tối ưu Statin trong điều trị hẹp cảnh. Ưu tiên: Cần kiểm tra LDL-C. Lặp lại: 6 tháng.", "I"]);

// 5. mapping_icd_medication.csv
// icd_code,drug_code,mapping_type,priority,note,evidence_level
appendToCsv('mapping_icd_medication.csv', ["I25.1", "MED-CARDIO-ASPIRIN", "recommended", 1, "Mục đích: Dự phòng huyết khối thứ phát trong bệnh mạch vành (AHA). Tác dụng phụ: Loét tiêu hóa. Tương tác: Kết hợp PPI nếu có yếu tố nguy cơ dạ dày.", "I"]);
appendToCsv('mapping_icd_medication.csv', ["I25.1", "MED-BB-BISOPROLOL", "recommended", 2, "Mục đích: Giảm nhịp tim và nhu cầu oxy cơ tim (ESC 2019). Tác dụng phụ: Chậm nhịp. Tương tác: Tránh dùng chung Non-DHP CCB.", "I"]);
appendToCsv('mapping_icd_medication.csv', ["I25.1", "MED-STATIN-ATORVASTATIN", "recommended", 3, "Mục đích: Hạ mỡ máu cường độ cao dự phòng biến cố tim mạch. Tác dụng phụ: Đau cơ. Tương tác: CYP3A4 inhibitors.", "I"]);

appendToCsv('mapping_icd_medication.csv', ["I83.9", "MED-VASC-DIOSMIN", "suggested", 1, "Mục đích: Hỗ trợ giảm triệu chứng nặng chân đau nhức tĩnh mạch. Tác dụng phụ: Tiêu chảy. Tương tác: An toàn.", "IIa"]);

appendToCsv('mapping_icd_medication.csv', ["I11.9", "MED-ARB-LOSARTAN", "preferred", 1, "Mục đích: Chặn quá trình phì đại thất trái do Tăng huyết áp. Giảm áp lực lên hệ tim. Tác dụng phụ: Tăng Kali.", "I"]);

appendToCsv('mapping_icd_medication.csv', ["I65.2", "MED-CARDIO-ASPIRIN", "recommended", 1, "Mục đích: Ngăn sự kết tập tụ cầu tại mảng xơ vữa hẹp cảnh. Tương tự bệnh vành mạn.", "I"]);
appendToCsv('mapping_icd_medication.csv', ["I65.2", "MED-STATIN-ROSUVASTATIN", "recommended", 2, "Mục đích: Statin cường độ cao ổn định mảng xơ vữa mạch cảnh tránh đột quỵ. Tác dụng phụ: Men gan tăng.", "I"]);

// 6. rule_claim_risk.csv
// rule_code,rule_name,severity,applies_to_icd,applies_to_cls,applies_to_drug,warning_message,recommended_action,condition_expression,condition_type,condition_parameter,is_active
appendToCsv('rule_claim_risk.csv', [
  "RISK-CARDIO-05", "Chỉ định siêu âm mạch máu (Doppler) quá sớm", "medium", "", "CLS-CDHA-DOPPLER-CHI|CLS-CDHA-DOPPLER-CANH", "",
  "Việc theo dõi siêu âm mảng xơ vữa hoặc giãn tĩnh mạch không nên lặp lại dưới 6-12 tháng vì bệnh mạn tính không thay đổi nhiều nếu không có biến cố cấp tính.",
  "Từ chối chỉ định hoặc ghi rõ lý do cấp tính trên hồ sơ.", "",
  "REPEAT_INTERVAL_VIOLATION", "180", "TRUE"
]);

appendToCsv('rule_claim_risk.csv', [
  "RISK-CARDIO-06", "Aspirin cho bệnh nhân tiền sử Dạ dày", "high", "K29.5|K21.9|K25.9|K26.9", "", "MED-CARDIO-ASPIRIN",
  "Aspirin 81mg kéo dài cho tuyến dự phòng tim mạch có nguy cơ gây tái xuất huyết hoặc viêm loét dạ dày cho bệnh nhân đang mang mã ICD K2X.",
  "Bắt buộc bổ sung Nhóm PPI (Esomeprazole) để dự phòng xuất huyết tiêu hóa nếu kê chung.", "",
  "INTERACTION_WARNING", "MED-PPI", "TRUE"
]);

appendToCsv('rule_claim_risk.csv', [
  "RISK-CARDIO-07", "Chẹn Beta (Bisoprolol) ở bệnh nhân Hô hấp", "high", "J44.9|J45.9", "", "MED-BB-BISOPROLOL",
  "Thận trọng dùng Chẹn Beta cho bệnh nhân COPD/En suyễn do nguy cơ co thắt phế quản hồi ứng gây khó thở cấp.",
  "Ưu tiên kiểm soát nhịp tim bằng nhóm CCB hoặc liều tối thiểu an toàn dưới sự giám sát chặt.", "",
  "INTERACTION_WARNING", "J4X", "TRUE"
]);

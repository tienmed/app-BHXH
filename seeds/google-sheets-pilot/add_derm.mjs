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
appendToCsv('catalog_icd.csv', ["L20.9", "Viêm da cơ địa", "Bệnh da và mô dưới da", "TRUE", "2026-01-01", "2099-12-31", "MOH-DERM-2026"]);
appendToCsv('catalog_icd.csv', ["L23.9", "Viêm da tiếp xúc dị ứng", "Bệnh da và mô dưới da", "TRUE", "2026-01-01", "2099-12-31", "MOH-DERM-2026"]);
appendToCsv('catalog_icd.csv', ["L40.0", "Vảy nến thể mảng", "Bệnh da và mô dưới da", "TRUE", "2026-01-01", "2099-12-31", "MOH-DERM-2026"]);
appendToCsv('catalog_icd.csv', ["L50.9", "Mày đay", "Bệnh da và mô dưới da", "TRUE", "2026-01-01", "2099-12-31", "MOH-DERM-2026"]);
appendToCsv('catalog_icd.csv', ["B35.9", "Bệnh nấm da", "Bệnh nhiễm trùng", "TRUE", "2026-01-01", "2099-12-31", "MOH-DERM-2026"]);

// 2. catalog_cls.csv
appendToCsv('catalog_cls.csv', ["CLS-XN-SOI-NAM", "Soi tươi/Nhuộm soi tìm nấm da (KOH)", "Xét nghiệm", "lần", "TRUE", "MOH-DERM-2026", "Phát hiện trực tiếp sợi tơ nấm/bào tử nấm trên vảy da", "Nghi ngờ bệnh lý do vi nấm (hắc lào/lang ben...)", 0, "FALSE", "UNKNOWN"]);
appendToCsv('catalog_cls.csv', ["CLS-XN-IGE", "Panel định lượng dị ứng nguyên đặc hiệu (IgE)", "Xét nghiệm", "lần", "TRUE", "MOH-DERM-2026", "Định lượng IgE đặc hiệu với dị nguyên nhằm phát hiện tác nhân dị ứng", "Mày đay mạn tính vô căn kéo dài trên 6 tuần", 180, "TRUE", "UNKNOWN"]);
appendToCsv('catalog_cls.csv', ["CLS-TDCN-SINH-THIET-DA", "Sinh thiết da/tổ chức dưới da", "Thủ thuật", "lần", "TRUE", "MOH-DERM-2026", "Chẩn đoán xác định bệnh lý viêm mạn tính/ung thư da", "Thương tổn da không điển hình, trơ với điều trị", 0, "TRUE", "UNKNOWN"]);

// 3. catalog_medication.csv
// max_duration, max_quantity, requires_monitoring
appendToCsv('catalog_medication.csv', ["MED-DERM-CORTICOID-MILD", "Hydrocortisone 1% (Tuýp 15g)", "Thuốc da liễu", "Bôi ngoài da", "Tuýp", "FALSE", "TRUE", "FORMULARY-DERM-2026", "Chống viêm/giảm ngứa cho tổn thương da dạng nhẹ-vừa", "Teo da nếu bôi kéo dài", "", 14, 2, "", ""]);
appendToCsv('catalog_medication.csv', ["MED-DERM-CORTICOID-HIGH", "Betamethasone dipropionate 0.05% (Tuýp 15g)", "Thuốc da liễu", "Bôi ngoài da", "Tuýp", "FALSE", "TRUE", "FORMULARY-DERM-2026", "Chống viêm, ức chế miễn dịch tại chỗ mạnh (Vảy nến, chàm nang lông)", "Nguy cơ teo da/dội ngược/tác dụng toàn thân", "", 7, 1, "", ""]);
appendToCsv('catalog_medication.csv', ["MED-DERM-ANTIFUNGAL", "Ketoconazole 2% (Tuýp 15g)", "Thuốc da liễu", "Bôi ngoài da", "Tuýp", "FALSE", "TRUE", "FORMULARY-DERM-2026", "Kháng nấm da (nhóm azole)", "Kích ứng nhẹ", "", 30, 2, "", ""]);

// 4. mapping_icd_cls.csv
appendToCsv('mapping_icd_cls.csv', ["B35.9", "CLS-XN-SOI-NAM", "recommended", 1, "Mục đích: Khẳng định sự hiện diện của nấm (vàng chẩn đoán) trước khi tốn thời gian bôi thuốc nấm kéo dài.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["L50.9", "CLS-XN-IGE", "suggested", 2, "Mục đích: Chỉ dùng khi Mày đay mạn tính (>6 tuần) vô căn để đi tìm tác nhân. Tuyệt đối không làm Panel dị nguyên cho Mày đay cấp tính.", "IIb"]);
appendToCsv('mapping_icd_cls.csv', ["L40.0", "CLS-TDCN-SINH-THIET-DA", "suggested", 3, "Mục đích: Chẩn đoán PB Vảy nến không điển hình với Á vảy nến/Lupus đỏ.", "I"]);
appendToCsv('mapping_icd_cls.csv', ["L40.0", "TT-CHAM-CUU", "suggested", 4, "Mục đích: Điều hòa thần kinh - miễn dịch bằng Châm Cứu (IPE), giúp hạn chế tần suất bùng phát vảy nến mạn do stress.", "IIa"]);

// 5. mapping_icd_medication.csv
appendToCsv('mapping_icd_medication.csv', ["L20.9", "MED-DERM-CORTICOID-MILD", "recommended", 1, "Mục đích: Viêm da cơ địa mức nhẹ-vừa. Tối đa 14 ngày, nên giảm liều cách ngày (Class I).", "I"]);
appendToCsv('mapping_icd_medication.csv', ["L40.0", "MED-DERM-CORTICOID-HIGH", "recommended", 1, "Mục đích: Vảy nến thể mảng. Bôi lưu ý diện tích rộng. Tuyệt đối không quá 7 ngày tránh teo da (Class I).", "I"]);
appendToCsv('mapping_icd_medication.csv', ["B35.9", "MED-DERM-ANTIFUNGAL", "recommended", 1, "Mục đích: Điều trị triệt để bào tử nấm tại chỗ. Cần bôi duy trì 1 tuần sau vảy bong.", "I"]);

// 6. rule_claim_risk.csv
appendToCsv('rule_claim_risk.csv', [
  "RISK-DERM-01", "Lạm dụng Panel Test Dị Nguyên sai Mục Đích", "high", "L50.9|L20.9|L23.9", "CLS-XN-IGE", "",
  "Xét nghiệm Panel 60-90 dị nguyên (IgE đặc hiệu) chỉ được phép sử dụng cho Mày đay mạn tính, viêm da cấp tính khó trị. Cấm chỉ định Tầm soát dàn trải diện rộng khi người bệnh vừa mới sổ mũi ngứa sơ qua.",
  "Xóa chỉ định IgE. Đơn thuần dùng Antihistamine 1 tuần.", "",
  "ILLEGAL_SCREENING", "CLS-XN-IGE", "TRUE"
]);

appendToCsv('rule_claim_risk.csv', [
  "RISK-DERM-02", "Dùng Corticoid mạnh (Betamethasone) Sai Nguyên Tắc Thận Trọng", "high", "L40.0|L20.9|L23.9", "", "MED-DERM-CORTICOID-HIGH",
  "Betamethasone là nhóm Corticoid Hoạt Tính Rất Mạnh. Kê đơn điều trị ngoại trú kéo dài vượt 7 ngày không kiểm soát sẽ gây teo da không hồi phục và nguy cơ ức chế tuyến thượng thận. Từ chối hồ sơ thanh toán BHYT lập tức.",
  "Giảm thời gian sử dụng thuốc bôi trên UI xuống dưới 7 ngày hoặc chuyển sang nhóm MILD Corticosteroid.", "",
  "MAX_DURATION_VIOLATION", "7", "TRUE"
]);

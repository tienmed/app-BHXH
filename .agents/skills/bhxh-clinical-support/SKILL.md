---
name: bhxh-clinical-support
description: Hỗ trợ quyết định lâm sàng và đánh giá rủi ro thanh toán bảo hiểm dựa trên các quy tắc và hướng dẫn của BHXH (Bảo hiểm Xã hội Việt Nam). Kỹ năng này giúp ánh xạ mã ICD-10 sang các chỉ định cận lâm sàng (CLS) và thuốc được khuyến nghị, đồng thời nêu bật các rủi ro xuất toán tiềm ẩn.
---

# Kỹ năng Hỗ trợ Lâm sàng BHXH

Kỹ năng này hỗ trợ quá trình ra quyết định lâm sàng trong chăm sóc ngoại trú tại Việt Nam, tập trung cụ thể vào việc tuân thủ các quy định của BHXH.

## 🎯 Khi nào nên sử dụng

Sử dụng kỹ năng này khi:
- **Triển khai hoặc sửa lỗi logic ánh xạ chẩn đoán** trong mã nguồn `app-BHXH`.
- **Thêm các phác đồ lâm sàng mới** hoặc các quy tắc bảo hiểm vào hệ thống.
- **Giải thích các khuyến nghị lâm sàng** cho người dùng hoặc các bên liên quan.
- **Xem xét mã nguồn** liên quan đến `decision-engine` hoặc `recommendation-api`.

## 🛣️ Lộ trình & Quy tắc chuẩn mực khi thêm dữ liệu mới (SOP)

Khi có yêu cầu thêm một mã bệnh ICD-10, Triệu chứng (Symptom), hoặc Phác đồ mới vào hệ thống, **bắt buộc** phải tuân theo lộ trình 4 bước chuẩn hóa cấu trúc sau để đảm bảo phân hệ `Decision Engine` chống lạm dụng hoạt động chính xác:

### Bước 1: Khai báo Danh mục cốt lõi (Catalogs)
- **Danh mục Bệnh (`catalog_icd.csv` / `catalog_symptom.csv`)**: Khai báo mã bệnh, tên mô tả chuẩn, và đảm bảo source_ref thuộc nguồn Y tế/BHXH chính quy (VD: `MOH-OBGYN-2026`).
- **Danh mục Thuốc/CLS (`catalog_medication.csv` / `catalog_cls.csv`)**: Nếu thuốc hoặc test chưa có sẵn, khi thêm mới **phải điền đầy đủ** giới hạn chống lạm dụng:
  - Thuốc: Phải có `max_duration_days` (VD: NSAID 14 ngày), `max_quantity_per_rx`, `requires_monitoring_cls` (VD: Statin cần test Men gan), và `contraindicated_icd`.
  - CLS: Phải có `min_repeat_interval_days` (VD: HbA1c 90 ngày, Lipid 30 ngày), `requires_red_flag` (True/False đối với các kỹ thuật cao như MRI/CT).

### Bước 2: Xây dựng Mapping Cận Lâm Sàng (`mapping_icd_cls.csv`)
Tất cả các CLS được gợi ý cho ICD phải thoả mãn Evidence-Based Medicine (EBM) trong 5 năm gần đây.
- Cột `mapping_type`: Chọn `recommended` (Bắt buộc/Khuyến cáo mạnh) hoặc `suggested` (Cân nhắc).
- Cột `note`: Bắt buộc thiết kế theo cụm cấu trúc: `Mục đích: [Lý do] Ưu tiên: [Đối tượng/Trường hợp cụ thể] Lặp lại: [Thời gian định kỳ]`.
- Cột `evidence_level`: Cung cấp mức độ bằng chứng y khoa (`I`, `IIa`, `IIb`, `III`) dựa trên guideline quốc tế (AHA, ESC, ACOG, v.v.).

### Bước 3: Xây dựng Mapping Thuốc (`mapping_icd_medication.csv`)
Tất cả đơn thuốc gợi ý luôn phải cân nhắc tác dụng phụ và tương tác (đã định nghĩa ở catalog) kèm chỉ định bối cảnh:
- Cột `note`: Bắt buộc thiết kế theo cụm cấu trúc: `Mục đích: [Cơ chế/Hiệu quả] Tác dụng phụ: [Nguy cơ chính] Tương tác: [Cảnh báo tương tác]`.
- Cột `evidence_level`: Mức độ bằng chứng (giống CLS).

### Bước 4: Thiết lập chốt chặn xuất toán BHYT (`rule_claim_risk.csv`)
Mỗi ICD quan trọng hoặc điều trị tốn kém phải có ít nhất 1 Rule cảnh báo:
- Định nghĩa rõ `severity` (high = Hard stop, medium = Yêu cầu giải trình, low = Soft alert).
- Phải chuyển đổi logic cảnh báo thành **dữ liệu cấu trúc hóa**:
  - `condition_type`: Chọn một type chuẩn trong hệ thống (VD: `MISSING_REQUIRED_EVIDENCE`, `REPEAT_INTERVAL_VIOLATION`, `MAX_DURATION_VIOLATION`, `INTERACTION_WARNING`).
  - `condition_parameter`: Truyền tham số hệ thống tự đánh giá (VD giá trị `90` cho số ngày, hoặc mã `CLS-XN-BETA-HCG` cho test còn thiếu).
- Lời văn `warning_message` phải nêu rõ hậu quả (VD: BHYT sẽ từ chối thanh toán nếu thiếu xét nghiệm A).

## 🖥️ Tương tác Backend (Decision Engine)

Hệ thống hoạt động dựa trên các bộ Catalog và Mapping nói trên. Tại endpoint `decision-engine`, nó không parse text tự do mà dùng các tham số giới hạn (như `max_duration_days`, `condition_type`) để kích hoạt thẻ Action Alert trên UI Bác sĩ trước khi submit. 

## 🚫 Nguyên tắc bất di bất dịch
1. **Tính minh bạch EBM**: Không có `evidence_level` & `note` đầy đủ -> TUYỆT ĐỐI KHÔNG MAPPING.
2. **Ưu tiên chặn lạm dụng (Over-prescription)**: Gợi ý ít nhưng chất lượng, chặn chặt các kỹ thuật/thuốc đắt tiền khi chưa đủ cơ sở tiền lâm sàng.

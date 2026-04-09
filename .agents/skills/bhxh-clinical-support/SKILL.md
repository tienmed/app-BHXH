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

## 🛠️ Các bước quy trình lâm sàng

### 1. Xác định phác đồ ICD-10
Khi nhận được chẩn đoán, hãy xác định phác đồ lâm sàng tương ứng:
- **I10 (Tăng huyết áp)**: Theo dõi thuốc ức chế men chuyển/chẹn thụ thể (ACEi/ARBs), thuốc chẹn kênh canxi (CCBs), và chức năng thận (Creatinine).
- **E11.9 (Đái tháo đường Týp 2)**: Theo dõi Metformin, chỉ số HbA1c (mỗi 3-6 tháng), và đường huyết.
- **E78.5 (Rối loạn lipid)**: Theo dõi nhóm thuốc statin và bộ mỡ máu.

### 2. Tạo khuyến nghị Cận lâm sàng (CLS)
- Gợi ý các xét nghiệm cụ thể cho các mã ICD đã chọn.
- Đảm bảo tần suất thực hiện tuân theo hướng dẫn của Bộ Y tế (MoH).
- **Quy tắc**: Mỗi gợi ý PHẢI bao gồm `rationale` (lý do) và `source` (nguồn).

### 3. Kiểm tra Thuốc
- Gợi ý các loại thuốc từ "danh mục an toàn".
- Xác minh trạng thái `is_bhyt_covered` (có được BHYT chi trả hay không).
- Bao gồm liều lượng và đường dùng (ví dụ: Đường uống).

### 4. Đánh giá rủi ro thanh toán (Xuất toán)
Đánh giá đơn thuốc dự thảo dựa trên các quy tắc "Claim Risk":
- **Mức độ Cao (High Severity)**: Rủi ro bị từ chối thanh toán ngay lập tức.
- **Mức độ Trung bình (Medium Severity)**: Cần lý do lâm sàng cụ thể để ghi đè (override).
- **Cơ cấu chi phí**: Theo dõi sự cân bằng giữa chi phí ICD, CLS và Thuốc.

## 🖥️ Tương tác Backend

Công cụ thử nghiệm (pilot engine) sử dụng Google Apps Script:
- **Endpoint**: `POST action=recommendations-preview`
- **Payload**:
    ```json
    {
      "action": "recommendations-preview",
      "encounterCode": "ENCOUNTER_ID",
      "diagnoses": [{ "icd": "CODE", "label": "LABEL" }]
    }
    ```

## 🚫 Nguyên tắc quan trọng
- **Tính giải thích được**: Không bao giờ đưa ra khuyến nghị mà không có nguồn trích dẫn.
- **Không gây gián đoạn**: Các khuyến nghị chỉ mang tính chất gợi ý; bác sĩ vẫn là người quyết định cuối cùng.
- **Khả năng kiểm toán**: Mọi quyết định ghi đè (override) đều phải được ghi lại kèm theo lý do.

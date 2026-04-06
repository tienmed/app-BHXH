---
name: bhxh-decision-engine-expert
description: Sử dụng khi làm việc với package `packages/decision-engine`. Cung cấp hướng dẫn về việc triển khai quy tắc, khớp phác đồ và duy trì logic quyết định lâm sàng cốt lõi.
---

# Chuyên gia Công cụ Quyết định BHXH

Kỹ năng này cung cấp kiến thức chuyên sâu để phát triển và duy trì `packages/decision-engine`, logic cốt lõi chịu trách nhiệm đưa ra các khuyến nghị lâm sàng.

## 🎯 Khi nào nên sử dụng

Sử dụng kỹ năng này khi:
- **Sửa đổi `runDecisionEngine`** hoặc logic hỗ trợ của nó.
- **Định nghĩa các interface mới** cho các khuyến nghị hoặc cảnh báo thanh toán.
- **Thêm logic khớp quy tắc phức tạp** (ví dụ: tham chiếu chéo nhiều chẩn đoán).
- **Tối ưu hóa công cụ** về hiệu suất hoặc khả năng mở rộng.

## 🛠️ Các bước phát triển

### 1. Hiểu về Schema
Công cụ dựa trên ba interface chính trong `src/index.ts`:
- `RecommendationItem`: Đơn vị gợi ý (CLS hoặc Thuốc).
- `ClaimAlert`: Thông báo rủi ro bảo hiểm.
- `EngineInput`: Payload kết hợp của chẩn đoán, phác đồ và quy tắc.

### 2. Triển khai Logic Quy tắc
Khi thêm một loại kiểm tra mới:
- Đảm bảo nó phù hợp với cấu trúc `EngineOutput`.
- Sử dụng các collection `Map` để loại bỏ trùng lặp các khuyến nghị một cách hiệu quả.
- Giữ cho công cụ "thuần khiết" (logic đồng bộ, không có tác dụng phụ bên ngoài).

### 3. Kiểm thử Công cụ
- Tạo các unit test mô phỏng `EngineInput`.
- Xác minh rằng nhiều phác đồ được kết hợp chính xác các `RecommendationItem`.
- Đảm bảo mức độ nghiêm trọng của `ClaimAlert` được xử lý theo yêu cầu nghiệp vụ.

## 🚫 Nguyên tắc quan trọng
- **Không có tác dụng phụ (No Side Effects)**: Công cụ chỉ nên chuyển đổi đầu vào thành đầu ra.
- **Loại bỏ trùng lặp**: Sử dụng `code` làm khóa duy nhất để lọc các mục dư thừa.
- **An toàn kiểu dữ liệu (Type Safety)**: Tuân thủ nghiêm ngặt các interface TypeScript đã định nghĩa.

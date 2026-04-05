# Ứng dụng Hỗ trợ Quyết định Lâm sàng BHXH (App BHXH)

Kho lưu trữ này chứa bộ khung dự án được đề xuất cho một ứng dụng dành cho bác sĩ nhằm hỗ trợ:

- gợi ý các chỉ định cận lâm sàng, xét nghiệm và thuốc phù hợp từ các phác đồ điều trị được khuyến nghị
- đánh giá sự kết hợp giữa mã ICD, CLS, và thuốc dựa trên các ràng buộc về cơ cấu chi phí
- cảnh báo nguy cơ bị từ chối thanh toán bảo hiểm trước khi hoàn tất chỉ định
- đảm bảo mỗi gợi ý đều có thể giải thích, được quản lý phiên bản và có thể kiểm toán

Dự án này bắt đầu như một bản dựng cấu trúc tập trung vào kế hoạch và hiện tại đã bao gồm một bộ khung có thể chạy được cho phạm vi triển khai thử nghiệm (pilot) đã được xác nhận.

## Định hướng Sản phẩm Đề xuất

Ứng dụng được định vị là một nền tảng **hỗ trợ quyết định lâm sàng + rào chắn thanh toán bảo hiểm**, không phải là một hệ thống kê đơn tự động.

Các nguyên tắc thiết kế cốt lõi:

1. Bác sĩ vẫn là người đưa ra quyết định cuối cùng.
2. Mỗi khuyến nghị phải hiển thị lý do, nguồn và phiên bản rõ ràng.
3. Các quy tắc phác đồ và quy tắc thanh toán bảo hiểm phải được quản lý riêng biệt.
4. Mọi quyết định thay đổi (override) đều phải được ghi lại để kiểm toán và xem xét sau này.
5. Hệ thống nên giảm thiểu rủi ro bị xuất toán bảo hiểm mà không làm gián đoạn việc chăm sóc lâm sàng hợp lý.

## Nhóm Năng lực Cốt lõi

- Tiếp nhận lượt khám: bệnh nhân, lượt khám, chẩn đoán ICD chính và phụ
- Phân tích phác đồ: đề xuất các bộ chỉ định và lộ trình điều trị theo chẩn đoán/bối cảnh
- Khuyến nghị CLS và xét nghiệm: đề xuất xét nghiệm, tần suất và lý do
- Hỗ trợ thuốc: đề xuất các nhóm thuốc trong danh mục an toàn và hướng dẫn liều lượng
- Quản lý chi phí: ước tính cơ cấu chi phí được cấu hình trên ICD, CLS và thuốc
- Kiểm tra rủi ro thanh toán: đánh dấu các chỉ định kết hợp có khả năng bị từ chối hoặc truy vấn
- Khả năng giải thích: hiển thị nguồn phác đồ, nguồn quy tắc thanh toán và mức độ tin cậy
- Thay đổi và kiểm toán: cho phép bác sĩ xác nhận với lý do cụ thể
- Cổng quản trị (Admin portal): quản lý phác đồ, ánh xạ, danh mục và phiên bản quy tắc

## Phạm vi Triển khai Thử nghiệm (Pilot) Đã xác nhận

Xác nhận vào ngày 3 tháng 4, 2026:

- Cài đặt chăm sóc: chỉ dành cho ngoại trú
- Chuyên khoa thử nghiệm: mở rộng đa khoa
- Hành vi sản phẩm: chỉ mang tính chất đề xuất, không tự động chuyển chỉ định
- Nguồn phác đồ: ưu tiên hướng dẫn của Bộ Y tế, với khả năng tùy biến cấp phòng khám trong tương lai

## Cấu trúc Kho lưu trữ

```text
.
|-- README.md
|-- package.json
|-- tsconfig.base.json
|-- .gitignore
|-- docs/
|   |-- 01-product-vision.md
|   |-- 02-scope-and-mvp.md
|   |-- 03-domain-model.md
|   |-- 04-system-architecture.md
|   |-- 05-implementation-roadmap.md
|   |-- 06-epics-and-backlog.md
|   |-- 07-pilot-decisions.md
|   |-- 08-google-sheets-ingestion.md
|   |-- 09-postgresql-schema-plan.md
|   |-- 10-import-roadmap.md
|   |-- 11-google-apps-script-pilot.md
|   |-- 12-google-sheet-seed-guide.md
|   |-- 13-google-apps-script-deployment.md
|   |-- open-questions.md
|   `-- adr/
|       `-- 0001-monorepo-and-stack.md
|-- integrations/
|   `-- google-apps-script/
|       |-- Code.gs
|       `-- README.md
|-- seeds/
|   `-- google-sheets-pilot/
|       `-- *.csv
|-- apps/
|   |-- web/
|   |   `-- README.md
|   |-- api/
|   |   `-- README.md
|   `-- admin/
|       `-- README.md
|-- packages/
|   |-- domain/
|   |   `-- README.md
|   |-- decision-engine/
|   |   `-- README.md
|   |-- ui/
|   |   `-- README.md
|   |-- shared-types/
|   |   `-- README.md
|   `-- config/
|       `-- README.md
`-- infra/
    |-- db/
    |   `-- README.md
    |-- docker/
    |   `-- README.md
    `-- observability/
        `-- README.md
```

## Chiến lược Xây dựng Đề xuất

- Giai đoạn 1: xác nhận phạm vi sản phẩm, nguồn dữ liệu và quyền sở hữu vận hành
- Giai đoạn 2: cung cấp khung web, admin và api có thể chạy được cho đợt pilot
- Giai đoạn 3: triển khai trình soạn thảo phác đồ, quản lý phiên bản quy tắc và bảng điều khiển kiểm toán
- Giai đoạn 4: tích hợp với hệ thống HIS, LIS, nhà thuốc và hệ thống xuất báo cáo BHYT

## Khởi động Dành cho Lập trình viên

```bash
npm install
npm run dev:web
npm run dev:admin
npm run dev:api
```

Xây dựng tất cả các ứng dụng:

```bash
npm run build
```

Cấu hình cho giao diện người dùng bác sĩ đối với Google Apps Script pilot (tùy chọn):

```bash
NEXT_PUBLIC_RECOMMENDATION_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

## Những Vấn đề Cần Xác nhận Trước khi Bắt đầu Viết Mã

- Triển khai mục tiêu: ứng dụng web nội bộ, ứng dụng desktop, hay ứng dụng di động đi kèm
- Có sẵn dữ liệu danh mục ICD, CLS, Thuốc và phác đồ lâm sàng
- Quyền sở hữu đối với việc cập nhật các phác đồ lâm sàng và các quy định của BHYT
- Quy trình phê duyệt đối với các quyết định thay đổi (override) của bác sĩ
- Ranh giới Tích hợp với các quy trình HIS/EMR/BHYT hiện tại

Tham khảo thư mục `docs/` để xem thêm bản đề xuất chi tiết.

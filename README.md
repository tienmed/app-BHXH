# Ứng dụng Hỗ trợ Quyết định Lâm sàng BHXH (App BHXH)

Dự án này là hệ thống phần mềm toàn diện dành cho bác sĩ nhằm hỗ trợ:
- Gợi ý chỉ định cận lâm sàng, xét nghiệm và đơn thuốc dựa trên các phác đồ điều trị tiên tiến nhất (EBM).
- Đánh giá sự kết hợp giữa mã bệnh ICD, cận lâm sàng (CLS) và thuốc dựa trên cơ cấu tỷ lệ chi phí bảo hiểm.
- Cảnh báo nguy cơ xuất toán bảo hiểm y tế ngay từ bước ra quyết định (trước khi hoàn tất chỉ định).
- Cung cấp các công cụ giải thích y khoa (khuyến nghị lặp lại định kỳ, chống chỉ định, tương tác thuốc).

Dự án hiện bao gồm một Frontend Next.js tương tác, một Admin Dashboard, và một hệ thống Backend Data Sync hoạt động cùng Google Sheets (làm kho dữ liệu tạm thời/Pilot).

## Điểm Nổi Bật Về Tính Năng

1. **Hỗ trợ quyết định lâm sàng (CDSS):** 
   - Giải nghĩa rõ ràng **Mục đích lâm sàng**, **Tiêu chí chỉ định** và **Chu kỳ lặp lại an toàn** của CLS.
   - Giải thích chi tiết **Mục đích điều trị**, **Tác dụng phụ** và **Tương tác thuốc/Thận trọng** của các nhóm thuốc.
2. **Tuân thủ BHYT & Chống Xuất Toán:** 
   - Tính toán và cảnh báo quá tỷ lệ theo giới hạn quy tắc (ví dụ: Thuốc > 50%, CLS > 30%...).
3. **Đồng bộ hóa Dữ Liệu Thời Gian Thực:**
   - Script hoạt động ngầm tự động theo dõi thay đổi trong folder `seeds/google-sheets-pilot` và đồng bộ qua Google Apps Script để render ngay lập tức API gợi ý cho Frontend.

## Cấu trúc Dự án (Monorepo)

```text
.
|-- apps/
|   |-- web/       # Web App cho Bác sĩ (Next.js)
|   |-- admin/     # Portal quản trị danh mục/quy tắc (Next.js)
|   `-- api/       # Backend API (Nest.js/Express)
|-- packages/      # Các thư viện dùng chung (types, eslint, tsconfig)
|-- integrations/
|   `-- google-apps-script/ # Code kết nối tới Google Sheets Database
|-- seeds/google-sheets-pilot/ # File CSV làm Source of Truth dữ liệu
|-- scripts/       # Script đồng bộ hóa (dev-all.mjs, watch-csv.mjs, v.v...)
`-- docs/          # Tài liệu đặc tả kiến trúc, luồng hệ thống
```

## Khởi động Dành cho Lập trình viên

Hệ thống đã được thiết lập để chạy tất cả các dịch vụ thông qua một lệnh duy nhất bằng `concurrently`.

1. Cài đặt toàn bộ dependencies:
```bash
npm install
```

2. Chạy môi trường Development (Khởi chạy Web, Admin, API và Data Sync Watcher):
```bash
npm run dev
```

Lệnh `npm run dev` sẽ gọi `scripts/dev-all.mjs` chạy song song:
- `app-bhxh-web` (Cổng bác sĩ)
- `app-bhxh-admin` (Cổng quản lý)
- `app-bhxh-api` (Backend)
- `sync:watch` (Theo dõi file CSV và đồng bộ lên Sheets)

## Nguồn dữ liệu & Google Apps Script

Trong giai đoạn Pilot, dữ liệu Danh mục và Phác đồ được cấu hình tại các file `CSV` ở thư mục `seeds/google-sheets-pilot/*.csv`. Các file này là Nguồn Chân Lý (Source of truth). 

Mọi thay đổi trên CSV ở Local sẽ tự động được script báo lên Google Sheets thông qua Deployment API của Google Apps Script (tại `integrations/google-apps-script/Code.gs`). Để apply logic backend Gas mới, cần phải cấu hình file `Code.gs` thẳng lên IDE của Google Apps Script. Chi tiết xem tại `docs/13-google-apps-script-deployment.md`.

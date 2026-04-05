# Checklist Go-Live Pilot

Checklist này dùng trước khi:

- demo nội bộ
- bàn giao cho đội chuyên môn test
- bắt đầu pilot thật với bác sĩ

## 1. Google Sheet

- [ ] Đã tạo đúng workbook pilot
- [ ] `Sheet ID` đang dùng là:
  - `1GsUDJJbFzOJV35HsoSqhi1jVzfurvd6_I3ECkZczPNg`
- [ ] Có đủ các tab:
  - `catalog_icd`
  - `catalog_cls`
  - `catalog_medication`
  - `protocol_header`
  - `protocol_item`
  - `rule_claim_risk`
  - `rule_cost_composition`
  - `mapping_icd_cls`
  - `mapping_icd_medication`
  - `import_control`
- [ ] Header các tab khớp đúng template
- [ ] Có dữ liệu seed tối thiểu cho pilot nội khoa ngoại trú
- [ ] `import_control.import_enabled = TRUE`

## 2. Google Apps Script

- [ ] Đã copy file [Code.gs](C:/Users/Thinkpad%20X280/Documents/App%20BHXH/integrations/google-apps-script/Code.gs) mới nhất
- [ ] `workbookId` trong Apps Script đúng với workbook pilot
- [ ] Đã `Deploy -> Manage deployments -> Edit -> New version`
- [ ] Web App vẫn dùng URL đúng
- [ ] Apps Script có quyền đọc và ghi vào workbook

## 3. Test endpoint Apps Script

- [ ] `action=template` trả JSON
- [ ] `action=workbook-inspect` trả `ready: true`
- [ ] `action=workbook-preview` trả dữ liệu mẫu
- [ ] `action=recommendations-preview` trả gợi ý từ dữ liệu Sheet
- [ ] `action=update-record` lưu được 1 thay đổi mẫu

## 4. Biến môi trường local

- [ ] File [apps/web/.env.local](C:/Users/Thinkpad%20X280/Documents/App%20BHXH/apps/web/.env.local) có `GOOGLE_APPS_SCRIPT_URL`
- [ ] File [apps/admin/.env.local](C:/Users/Thinkpad%20X280/Documents/App%20BHXH/apps/admin/.env.local) có `GOOGLE_APPS_SCRIPT_URL`
- [ ] URL trong 2 file giống nhau

## 5. Doctor UI

- [ ] Mở được [http://localhost:3000](http://localhost:3000)
- [ ] Chọn được nhiều ICD
- [ ] Nút `Tải gợi ý` hoạt động
- [ ] Có gợi ý CLS theo ICD
- [ ] Có gợi ý thuốc theo ICD
- [ ] Có cảnh báo nguy cơ xuất toán
- [ ] Có hiển thị tỷ trọng chi phí ICD / CLS / thuốc
- [ ] Có thể dùng chế độ thao tác nhanh

## 6. Admin UI

- [ ] Mở được [http://localhost:3002](http://localhost:3002)
- [ ] `Test Apps Script` hoạt động
- [ ] `Kiểm tra workbook` báo đủ tab, đủ cột
- [ ] `Xem dữ liệu thật` hiển thị các tab chính
- [ ] Tìm kiếm theo mã hoạt động
- [ ] `Copy mã` hoạt động
- [ ] `Xem chi tiết` hoạt động
- [ ] `Xuất CSV theo bộ lọc` hoạt động
- [ ] `Lưu về Google Sheet` hoạt động
- [ ] Có sinh log ở tab `admin_change_log`

## 7. Nghiệp vụ pilot

- [ ] ICD pilot đã có trong danh mục
- [ ] CLS pilot đã có mapping cơ bản
- [ ] Thuốc pilot đã có mapping cơ bản
- [ ] Rule cảnh báo xuất toán đã có ít nhất các tình huống cơ bản
- [ ] Có 1 bộ ca test mẫu cho:
  - tăng huyết áp
  - đái tháo đường típ 2
  - tăng huyết áp + đái tháo đường

## 8. Dữ liệu chỉnh sửa

- [ ] Có người chịu trách nhiệm cập nhật dữ liệu phác đồ
- [ ] Có người chịu trách nhiệm duyệt rule xuất toán
- [ ] Có quy ước ghi `Ghi chú thay đổi`
- [ ] Không cho chỉnh trực tiếp ngoài quy trình đã thống nhất

## 9. Kiểm thử nhanh trước demo

- [ ] Restart app local
- [ ] Hard refresh trình duyệt
- [ ] Test lại 1 ca đơn giản với `I10`
- [ ] Test lại 1 ca có 2 ICD
- [ ] Test sửa 1 rule hoặc 1 mapping trên admin
- [ ] Quay lại doctor UI để xác nhận thay đổi phản ánh đúng

## 10. Mức sẵn sàng để demo

Sẵn sàng demo khi tất cả mục dưới đây đều đúng:

- [ ] `3000` chạy ổn
- [ ] `3002` chạy ổn
- [ ] Apps Script trả dữ liệu đúng
- [ ] Có ít nhất 3 ca minh họa thực tế
- [ ] Có thể sửa 1 dòng và thấy thay đổi phản ánh lại trên app

## 11. Chưa nên go-live nếu còn các dấu hiệu này

- [ ] `workbook-inspect` chưa `ready`
- [ ] doctor UI vẫn đang fallback sang mock
- [ ] lưu từ admin chưa tạo được `admin_change_log`
- [ ] mapping ICD -> CLS hoặc ICD -> thuốc còn quá mỏng
- [ ] chưa thống nhất người chịu trách nhiệm cập nhật dữ liệu

## 12. File tham chiếu

- [DEPLOY_APPS_SCRIPT.md](C:/Users/Thinkpad%20X280/Documents/App%20BHXH/DEPLOY_APPS_SCRIPT.md)
- [Code.gs](C:/Users/Thinkpad%20X280/Documents/App%20BHXH/integrations/google-apps-script/Code.gs)
- [Doctor UI](C:/Users/Thinkpad%20X280/Documents/App%20BHXH/apps/web/src/app/page.tsx)
- [Admin UI](C:/Users/Thinkpad%20X280/Documents/App%20BHXH/apps/admin/src/app/page.tsx)

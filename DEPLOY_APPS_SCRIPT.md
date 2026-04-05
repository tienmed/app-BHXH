# Deploy Google Apps Script

Tài liệu này dùng để cập nhật file `Code.gs` mới nhất lên Google Apps Script và kiểm tra lại kết nối với app quản trị `http://localhost:3002`.

## 1. Lấy file `Code.gs` mới nhất

File nguồn trong dự án nằm tại:

- `C:\Users\Thinkpad X280\Documents\App BHXH\integrations\google-apps-script\Code.gs`

Cách mở nhanh bằng PowerShell:

```powershell
notepad "C:\Users\Thinkpad X280\Documents\App BHXH\integrations\google-apps-script\Code.gs"
```

Sau đó:

1. Copy toàn bộ nội dung file `Code.gs`
2. Giữ sẵn để dán vào Google Apps Script

## 2. Mở project Google Apps Script

1. Truy cập [Google Apps Script](https://script.google.com)
2. Mở project đã tạo cho app này
3. Mở file `Code.gs`

## 3. Cập nhật mã mới

1. Xóa toàn bộ nội dung cũ trong `Code.gs`
2. Dán toàn bộ nội dung mới từ file local
3. Kiểm tra lại dòng:

```javascript
workbookId: '1GsUDJJbFzOJV35HsoSqhi1jVzfurvd6_I3ECkZczPNg'
```

Nếu file đang để rỗng `''` thì điền lại đúng `Sheet ID` của bạn.

## 4. Lưu project

1. Bấm `Ctrl + S`
2. Đợi Google Apps Script lưu xong

## 5. Redeploy Web App

1. Bấm `Deploy`
2. Chọn `Manage deployments`
3. Chọn deployment Web App hiện tại
4. Bấm biểu tượng `Edit`
5. Chọn `New version`
6. Bấm `Deploy`

Lưu ý:

- Có thể URL `/exec` giữ nguyên
- Quan trọng là phải tạo `New version`

URL hiện bạn đang dùng:

- [Apps Script Web App](https://script.google.com/macros/s/AKfycbzfgoGvVv2hjHvLZ6pKOAr2728Q3DJ2MoprrPvKzUVLmRNlK8zMywn5u6s7P7mYhsvS/exec)

## 6. Kiểm tra nhanh Apps Script

Mở trực tiếp các URL sau trên trình duyệt:

- [Template](https://script.google.com/macros/s/AKfycbzfgoGvVv2hjHvLZ6pKOAr2728Q3DJ2MoprrPvKzUVLmRNlK8zMywn5u6s7P7mYhsvS/exec?action=template)
- [Workbook Inspect](https://script.google.com/macros/s/AKfycbzfgoGvVv2hjHvLZ6pKOAr2728Q3DJ2MoprrPvKzUVLmRNlK8zMywn5u6s7P7mYhsvS/exec?action=workbook-inspect)
- [Workbook Preview](https://script.google.com/macros/s/AKfycbzfgoGvVv2hjHvLZ6pKOAr2728Q3DJ2MoprrPvKzUVLmRNlK8zMywn5u6s7P7mYhsvS/exec?action=workbook-preview)

Kỳ vọng:

- `template` trả JSON có danh sách tab
- `workbook-inspect` trả `ready: true`
- `workbook-preview` trả dữ liệu mẫu từ các tab chính

## 7. Khởi động lại app local

Trong PowerShell:

```powershell
cd "C:\Users\Thinkpad X280\Documents\App BHXH"
npm run dev:admin
```

Hoặc nếu chạy toàn bộ:

```powershell
cd "C:\Users\Thinkpad X280\Documents\App BHXH"
npm run dev
```

## 8. Test trên màn quản trị

Mở:

- [http://localhost:3002](http://localhost:3002)

Thao tác theo thứ tự:

1. `Test Apps Script`
2. `Kiểm tra workbook`
3. `Xem dữ liệu thật`
4. `Xem chi tiết` một dòng bất kỳ
5. sửa dữ liệu
6. nhập `Ghi chú thay đổi`
7. bấm `Lưu về Google Sheet`

## 9. Kiểm tra log thay đổi

Sau khi lưu thành công:

- Google Sheet sẽ có thêm tab `admin_change_log` nếu trước đó chưa có
- tab này dùng để lưu lịch sử chỉnh sửa từ màn admin

Các cột log gồm:

- `changed_at`
- `tab_name`
- `key_field`
- `key_value`
- `actor`
- `note`
- `changed_fields_json`

## 10. Khi nào cần redeploy lại

Bạn cần redeploy lại Google Apps Script mỗi khi có thay đổi trong:

- `integrations/google-apps-script/Code.gs`

Bạn không cần redeploy Apps Script nếu chỉ thay đổi:

- `apps/admin/...`
- `apps/web/...`
- CSS hoặc UI local

## 11. Lỗi thường gặp

### `Không thể lấy dữ liệu thật từ Google Sheet`

Kiểm tra:

- đã redeploy `New version` chưa
- `GOOGLE_APPS_SCRIPT_URL` có đúng không
- Apps Script có quyền truy cập Google Sheet không

### `Workbook còn thiếu tab hoặc thiếu cột`

Kiểm tra lại tên tab và header trong Google Sheet theo template.

### `Không thể lưu thay đổi`

Kiểm tra:

- bạn đã redeploy bản `Code.gs` mới nhất chưa
- dòng đang sửa có khóa chính như `icd_code`, `cls_code`, `drug_code`, `rule_code`
- Google Apps Script còn quyền ghi vào workbook không

## 12. File liên quan

- [Code.gs](C:/Users/Thinkpad%20X280/Documents/App%20BHXH/integrations/google-apps-script/Code.gs)
- [appsscript.json](C:/Users/Thinkpad%20X280/Documents/App%20BHXH/integrations/google-apps-script/appsscript.json)
- [Admin page](C:/Users/Thinkpad%20X280/Documents/App%20BHXH/apps/admin/src/app/page.tsx)
- [Update route](C:/Users/Thinkpad%20X280/Documents/App%20BHXH/apps/admin/src/app/api/google-sheets/update-record/route.ts)

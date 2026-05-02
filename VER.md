# Version Notes (VER)

## 2026.09 — Feedback Summary API for Rollout Monitoring
- Bổ sung endpoint tổng hợp feedback theo nhóm lý do từ dữ liệu CSV để theo dõi chất lượng phản hồi toàn hệ thống.
- Thêm route proxy ở web và hiển thị nhanh tổng feedback + nhóm lý do phổ biến ở màn hình khởi tạo phiên.
- Mục tiêu: tạo nền tảng dữ liệu cho vòng cập nhật mapping/rule theo đợt.

## 2026.08 — Local Feedback Quality Metrics
- Bổ sung thống kê local cho phản hồi có cấu trúc để theo dõi chất lượng dữ liệu feedback trong pilot.
- Hiển thị nhanh số lượng feedback có cấu trúc ngay ở màn hình khởi tạo phiên.
- Cập nhật checklist triển khai: đánh dấu hoàn thành hạng mục theo dõi tỷ lệ feedback có cấu trúc (mức local).

## 2026.07 — Mandatory Feedback Reason Selection
- Bổ sung kiểm tra bắt buộc chọn nhóm lý do feedback (không cho gửi khi để “Ý kiến chung” mặc định).
- Mục tiêu: tăng tỷ lệ phản hồi có cấu trúc, giúp dữ liệu phản hồi dùng được cho vòng cải tiến rule/mapping.
- Cập nhật checklist triển khai: đánh dấu hoàn thành hạng mục bắt buộc chọn nhóm lý do trước khi gửi.

## 2026.06 — Structured Feedback Taxonomy
- Mở rộng loại phản hồi trong UI để bác sĩ chọn nhanh các nhóm lý do có cấu trúc: rủi ro BHYT, thiếu bằng chứng/giải trình, lo ngại chi phí.
- Cập nhật shared type của feedback để đồng bộ dữ liệu phản hồi có cấu trúc giữa UI và backend.
- Cập nhật checklist triển khai: đánh dấu hoàn thành hạng mục chuẩn hóa nhóm lý do feedback.

## 2026.05 — Assist Mode Usage Tracking (Local)
- Bổ sung thống kê số phiên theo từng assist mode (`full`, `concise`, `risk-only`) ngay tại màn hình khởi tạo phiên.
- Lưu thống kê ở local để hỗ trợ theo dõi nhanh mức độ sử dụng các chế độ hỗ trợ trong giai đoạn pilot.
- Cập nhật checklist triển khai: đánh dấu hoàn thành hạng mục dashboard theo assist mode (mức local session).

## 2026.04 — Session Expiry Warning
- Bổ sung cảnh báo khi phiên làm việc còn <= 5 phút trước khi tự thoát.
- Thêm thao tác “Gia hạn phiên” để bác sĩ tiếp tục làm việc mà không mất ngữ cảnh.
- Cập nhật checklist triển khai: đánh dấu hoàn thành hạng mục cảnh báo sắp hết phiên.

## 2026.03 — Delivery Checklist & Progress Tracking
- Bổ sung `CHECKLIST_TASK_TRIEN_KHAI_APP.md` để theo dõi tiến độ phát triển app theo các nhóm hạng mục: session ẩn danh, assist mode, đa ICD, feedback, dữ liệu ICD, tích hợp HIS và KPI phát hành.
- Checklist ghi nhận rõ trạng thái đã làm / đang làm / chưa làm để hỗ trợ điều phối triển khai giữa chuyên môn và kỹ thuật.

## 2026.02 — Product Redefinition & Clinical Direction Update
- Định nghĩa lại dự án ở cấp sản phẩm trong `README.md`, tập trung vào giá trị cho bác sĩ và mục tiêu lâm sàng, bỏ nội dung triển khai kỹ thuật.
- Chốt định hướng phát triển: cá nhân hóa theo hồ sơ phiên làm việc ẩn danh, tối ưu gợi ý theo nhóm bác sĩ, và tăng hiệu quả xử trí ca đa ICD.
- Bổ sung định hướng chuẩn hóa phản hồi bác sĩ để hệ thống học liên tục và giảm cảnh báo nhiễu.
- Nâng phiên bản fallback metadata từ `2026.01` lên `2026.02`.

## 2026.01
- Phiên bản nền cho pilot CSV nội bộ với metadata phác đồ nguồn local.

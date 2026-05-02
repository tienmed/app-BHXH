# Checklist triển khai phát triển App BHXH

> Mục tiêu: theo dõi tiến độ từ phiên bản pilot sang trợ lý quyết định lâm sàng thực chiến.

## 0) Product & Governance
- [x] Viết lại định nghĩa sản phẩm theo hướng lấy bác sĩ làm trung tâm.
- [x] Thiết lập file theo dõi phiên bản (`VER.md`).
- [ ] Chuẩn hóa quy trình cập nhật version theo mốc phát hành (tháng/quý).
- [ ] Thiết lập review định kỳ với nhóm bác sĩ sử dụng thật (2 tuần/lần).

## 1) Session ẩn danh & cá nhân hóa theo nhóm bác sĩ
- [x] Màn hình khởi tạo phiên trước khi vào workspace.
- [x] Thu thập profile tối thiểu theo phiên (chuyên khoa, kinh nghiệm, mức hỗ trợ).
- [x] Lưu profile phiên cục bộ để giảm thao tác lặp lại.
- [x] Tự thoát phiên sau 1 giờ không hoạt động.
- [x] Cho phép kết thúc phiên thủ công.
- [x] Thêm cảnh báo trước khi hết phiên (ví dụ trước 5 phút).
- [x] Thêm dashboard tỷ lệ dùng theo từng assist mode (mức local session).

## 2) Tối ưu luồng gợi ý theo assist mode
- [x] `full`: giữ toàn bộ gợi ý.
- [x] `concise`: rút gọn danh sách gợi ý trọng tâm.
- [x] `risk-only`: ưu tiên cảnh báo rủi ro.
- [x] Đồng bộ assist mode từ frontend sang API preview.
- [ ] Đo KPI hiệu quả theo từng mode (thời gian thao tác, tỷ lệ chấp nhận).
- [ ] A/B test ngưỡng rút gọn để giảm nhiễu nhưng không bỏ sót.

## 3) Mở rộng năng lực cho ca đa ICD (>1 ICD)
- [ ] Xây dựng rule “giao nhau” giữa các ICD đồng mắc.
- [ ] Xây dựng rule phát hiện xung đột CLS/thuốc theo đa ICD.
- [ ] Tạo điểm ưu tiên cho từng gợi ý trong ca đa bệnh.
- [ ] Hiển thị rõ “vì sao gợi ý” ở chế độ đa ICD (explainability).
- [ ] Đánh giá riêng KPI cho ca đa ICD (acceptance, override, warning precision).

## 4) Chuẩn hóa feedback để hệ thống học
- [x] Chuẩn hóa nhóm lý do feedback (không phù hợp/thiếu/chỉnh liều/rủi ro BHYT...).
- [x] Bắt buộc chọn nhóm lý do trước khi nhập ghi chú tự do.
- [x] Theo dõi tỷ lệ feedback có cấu trúc vs feedback tự do (mức local thống kê).
- [ ] Tạo vòng phản hồi cập nhật dữ liệu mapping/rule theo đợt.

## 5) Dữ liệu & độ phủ ICD
- [x] Bổ sung metadata `chapter` và dùng cho lọc theo chuyên khoa.
- [x] Mở rộng danh mục ICD cho các nhóm ưu tiên pilot.
- [ ] Rà soát chất lượng mô tả ICD (chuẩn hóa thuật ngữ, tránh trùng/khác nghĩa).
- [ ] Lập kế hoạch mở rộng tiếp các chapter chưa phủ tốt.
- [ ] Theo dõi “ICD coverage score” theo tháng.

## 6) Tích hợp hệ thống (định hướng)
- [ ] Thiết kế contract dữ liệu để sẵn sàng kết nối HIS.
- [ ] Tách dữ liệu “context bệnh nhân” tối thiểu khi chưa có HIS.
- [ ] Định nghĩa rõ ranh giới dữ liệu cá nhân và dữ liệu ẩn danh.
- [ ] Pilot tích hợp 1 chiều trước (đọc dữ liệu encounter cơ bản).

## 7) KPI mục tiêu phát hành
- [ ] Giảm thời gian hoàn tất chỉ định trung bình >= 20% ở ca thường gặp.
- [ ] Tăng tỷ lệ chấp nhận gợi ý >= 15% sau 2 chu kỳ cải tiến.
- [ ] Giảm cảnh báo nhiễu (dismiss không lý do) >= 20%.
- [ ] Tăng chất lượng xử lý ca đa ICD (đo bằng KPI riêng).

## Nhật ký cập nhật checklist
- 2026-05-02: Khởi tạo checklist theo hiện trạng triển khai.
- 2026-05-02: Hoàn thành cảnh báo sắp hết phiên và nút gia hạn phiên làm việc.
- 2026-05-02: Hoàn thành thống kê số phiên theo từng assist mode trên giao diện khởi tạo phiên.
- 2026-05-02: Mở rộng taxonomy feedback có cấu trúc (rủi ro BHYT/thiếu bằng chứng/lo ngại chi phí).
- 2026-05-02: Bắt buộc chọn nhóm lý do feedback trước khi gửi phản hồi.
- 2026-05-02: Bổ sung thống kê local số phản hồi có cấu trúc để theo dõi chất lượng feedback.
- 2026-05-02: Bổ sung API summary feedback theo nhóm để chuẩn bị vòng cập nhật mapping/rule theo đợt.

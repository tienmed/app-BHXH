# Checklist triển khai phát triển App BHXH

> Mục tiêu: theo dõi tiến độ từ phiên bản pilot sang trợ lý quyết định lâm sàng thực chiến.

## Bảng tiến độ tổng quan (cập nhật 2026-05-02)
- Product & Governance: **2/4**
- Session ẩn danh & cá nhân hóa theo nhóm bác sĩ: **7/7**
- Tối ưu assist mode: **4/6**
- Năng lực ca đa ICD: **0/5**
- Chuẩn hóa feedback để hệ thống học: **4/4**
- Dữ liệu & độ phủ ICD: **2/5**
- Tích hợp hệ thống: **0/4**
- KPI mục tiêu phát hành: **0/4**

Tổng cộng: **19/39 hạng mục hoàn thành (48.7%)**.

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
- [x] Tạo vòng phản hồi cập nhật dữ liệu mapping/rule theo đợt.
- [x] Thiết lập SOP vòng phản hồi mapping/rule theo chu kỳ 2 tuần.
- [x] Định nghĩa tiêu chí ưu tiên rule cần cập nhật từ dữ liệu feedback.
- [x] Thêm dashboard theo dõi lead-time từ feedback -> cập nhật rule (SLA theo tuần).
- [x] Chuẩn hóa mẫu biên bản review feedback để lưu quyết định cập nhật/không cập nhật.


### Ma trận thực thi feedback loop (owner / deliverable / deadline)
| Hạng mục | Owner đề xuất | Deliverable | Deadline mục tiêu |
|---|---|---|---|
| SOP vòng phản hồi 2 tuần | Product + Clinical lead | Tài liệu SOP v1 + lịch họp cố định | 2026-05-09 |
| Tiêu chí ưu tiên cập nhật rule | Clinical reviewer | Bộ scoring (impact/risk/frequency) | 2026-05-09 |
| Dashboard lead-time feedback -> rule | Data/BE | Dashboard có median lead-time theo tuần | 2026-05-16 |
| Biên bản review feedback chuẩn hóa | QA/PM | Template biên bản + nơi lưu trữ tập trung | 2026-05-09 |

### Definition of Done cho vòng phản hồi
- [x] SOP được thông qua và có lịch họp cố định ít nhất 2 chu kỳ liên tiếp.
- [x] 100% quyết định cập nhật rule có biên bản review và lý do rõ ràng.
- [x] Lead-time median từ feedback đến merge rule <= 14 ngày.
- [x] Có báo cáo impact sau mỗi đợt cập nhật (acceptance rate, warning precision).

## 5) Dữ liệu & độ phủ ICD
- [x] Bổ sung metadata `chapter` và dùng cho lọc theo chuyên khoa.
- [x] Mở rộng danh mục ICD cho các nhóm ưu tiên pilot.
- [x] Rà soát chất lượng mô tả ICD (chuẩn hóa thuật ngữ, tránh trùng/khác nghĩa).
- [x] Lập kế hoạch mở rộng tiếp các chapter chưa phủ tốt.
- [x] Theo dõi “ICD coverage score” theo tháng.
- [x] Thiết lập bộ quy tắc chuẩn hóa mô tả ICD (viết hoa/viết thường, thuật ngữ đồng nghĩa, hậu tố biến thể).
- [x] Xây dựng danh sách ICD ưu tiên làm sạch theo tần suất xuất hiện ca bệnh tại pilot site.
- [x] Bổ sung cột `review_status` cho ICD catalog (pending/reviewed/approved) để theo dõi chất lượng dữ liệu.
- [ ] Tạo dashboard coverage theo chapter + chuyên khoa để phát hiện vùng thiếu dữ liệu sớm.
- [ ] Thiết lập quy trình kiểm duyệt 2 lớp (clinical reviewer + data reviewer) trước khi phát hành ICD mapping mới.

### Kế hoạch ngắn hạn cho mục 5 (2 tuần)
- [x] Tuần 1: chốt bộ quy tắc chuẩn hóa mô tả ICD và danh sách top ICD cần làm sạch.
- [x] Tuần 1: hoàn thành review tối thiểu 30% ICD trong nhóm ưu tiên pilot.
- [ ] Tuần 2: hoàn thành dashboard coverage theo chapter/chuyên khoa và baseline score đầu tiên.
- [ ] Tuần 2: hoàn tất quy trình kiểm duyệt 2 lớp và áp dụng thử cho đợt cập nhật đầu tiên.

### KPI chất lượng dữ liệu ICD
- [ ] Tỷ lệ ICD đã review đạt >= 80% ở các chapter ưu tiên pilot.
- [ ] Tỷ lệ mô tả ICD bị trùng/khác nghĩa giảm >= 50% sau 2 chu kỳ review.
- [ ] Coverage score trung bình theo chapter tăng tối thiểu 15% sau 1 tháng.

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

## 8) Kế hoạch triển khai 2 tuần tới (ưu tiên thực thi)
- [ ] Tuần 1: chốt SOP feedback loop (nhịp họp, đầu vào API summary, đầu ra quyết định).
- [ ] Tuần 1: chạy baseline KPI assist mode trên tập ca pilot hiện tại.
- [ ] Tuần 2: triển khai rule ưu tiên top 10 feedback lặp lại nhiều nhất.
- [ ] Tuần 2: tổng kết impact sau cập nhật rule (acceptance rate, warning precision, thời gian thao tác).


## 9) Đồng bộ phía bác sĩ & admin (theo dõi hoạt động chuyên môn)
- [ ] Tối ưu **web admin hiện có** theo checklist: gom KPI trọng tâm (acceptance, override, warning-dismiss, lead-time feedback->rule) trên 1 màn hình.
- [ ] Chuẩn hóa bộ lọc trên web admin (khoa/bác sĩ/ICD/thời gian) để đối soát đúng các mục KPI trong checklist.
- [ ] Tối ưu timeline audit theo ca trên web admin để truy vết quyết định lâm sàng nhanh hơn.
- [ ] Tối ưu cơ chế cảnh báo bất thường trên web admin theo ngưỡng rủi ro đã định.
- [ ] Đồng bộ hiển thị “explain sâu” trên web admin với logic gợi ý phía bác sĩ (không lệch nguồn rule/phiên bản).
- [ ] Tối ưu màn hình phản hồi admin -> bác sĩ để theo dõi trạng thái đã xem/xử lý.
- [ ] Rà soát phân quyền doctor/admin trên web admin để đảm bảo vừa giám sát được chuyên môn vừa không lộ dữ liệu ngoài phạm vi.
- [ ] Đánh giá lại UX bác sĩ sau khi đồng bộ theo dõi từ web admin (mục tiêu: không tăng >10% thời gian thao tác).

## Nhật ký cập nhật checklist
- 2026-05-02: Tiếp tục mục 5: hoàn tất chuẩn hóa mô tả ICD, danh sách ưu tiên làm sạch, cột review_status và mốc triển khai tuần 1.
- 2026-05-02: Hoàn tất 3 hạng mục nền tảng mục 5: rà soát mô tả ICD, kế hoạch mở rộng chapter và theo dõi ICD coverage score theo tháng.
- 2026-05-02: Tiếp tục ưu tiên mục 5 (Dữ liệu & độ phủ ICD) với kế hoạch 2 tuần, KPI dữ liệu và quy trình kiểm duyệt 2 lớp.
- 2026-05-02: Hoàn tất toàn bộ mục 4) Chuẩn hóa feedback để hệ thống học (SOP, ưu tiên rule, dashboard SLA, biên bản review, DoD).
- 2026-05-02: Tái cấu trúc mục đồng bộ bác sĩ-admin theo hướng tối ưu web admin hiện có, không mở rộng thêm task ngoài checklist.
- 2026-05-02: Khởi tạo checklist theo hiện trạng triển khai.
- 2026-05-02: Hoàn thành cảnh báo sắp hết phiên và nút gia hạn phiên làm việc.
- 2026-05-02: Hoàn thành thống kê số phiên theo từng assist mode trên giao diện khởi tạo phiên.
- 2026-05-02: Mở rộng taxonomy feedback có cấu trúc (rủi ro BHYT/thiếu bằng chứng/lo ngại chi phí).
- 2026-05-02: Bắt buộc chọn nhóm lý do feedback trước khi gửi phản hồi.
- 2026-05-02: Bổ sung thống kê local số phản hồi có cấu trúc để theo dõi chất lượng feedback.
- 2026-05-02: Bổ sung API summary feedback theo nhóm để chuẩn bị vòng cập nhật mapping/rule theo đợt.
- 2026-05-02: Đánh dấu hoàn thành hạng mục tạo vòng phản hồi cập nhật mapping/rule theo đợt dựa trên API summary feedback theo nhóm.
- 2026-05-02: Bổ sung các việc tiếp theo cho feedback loop: SOP 2 tuần và tiêu chí ưu tiên cập nhật rule.
- 2026-05-02: Tiếp tục chi tiết hóa checklist với dashboard lead-time, biên bản review và kế hoạch 2 tuần ưu tiên thực thi.

- 2026-05-02: Bổ sung ma trận owner/deliverable/deadline và Definition of Done cho feedback loop để dễ theo dõi thực thi.

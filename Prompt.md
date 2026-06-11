[FEATURE REQUEST - FULL UPGRADE: AUTH, USER, GROUP & ADVANCED SETTLEMENT SYSTEM]
Dự án OurMoney đã kết nối Google Login và MongoDB thành công. Hãy thực hiện nâng cấp đồng loạt các tính năng mới theo chuẩn Next.js 16 Server Actions như sau:

1. HỆ THỐNG AUTH & USER PROFILE (Avatar & Name):
- Thêm nút ĐĂNG XUẤT (Logout) ở Sidebar/Navbar. Sử dụng hàm `signOut` từ Auth.js để xóa session và redirect về trang `/`.
- Tại trang cấu hình tài khoản (hoặc một popup nhỏ ở Dashboard), cho phép người dùng xem tên + ảnh đại diện được lấy từ Google. 
- Bổ sung ô Input cho phép người dùng chỉnh sửa Tên hiển thị (Name) và cập nhật đường dẫn Ảnh đại diện (Avatar URL) mới, lưu trực tiếp vào collection Users trong MongoDB.

2. QUẢN LÝ NHÓM (Group Management):
- Tại trang chi tiết nhóm (`src/app/group/[id]/page.tsx`), bổ sung thêm một nút "Xóa nhóm" (chỉ dành cho chủ nhóm hoặc cho phép mọi thành viên tùy bạn cấu hình).
- Viết Server Action xóa nhóm và toàn bộ hóa đơn thuộc nhóm đó trong DB, sau đó dùng `redirect('/dashboard')`.

3. LOGIC & GIAO DIỆN QUYẾT TOÁN THÔNG MINH (Advanced Settlement UI):
Tại khu vực Quyết toán của Nhóm, hãy tính toán và phân loại luồng tiền rõ ràng cho từng thành viên:
- Số tiền MÌNH CẦN TRẢ người khác: Hiển thị màu ĐỎ (Ví dụ: Bạn nợ Thành: -50.000đ).
- Số tiền NGƯỜI KHÁC PHẢI TRẢ MÌNH: Hiển thị màu XANH LÁ (Ví dụ: An nợ bạn: +100.000đ).
- Danh sách phải liệt kê chi tiết theo từng người: Ai đang nợ bao nhiêu, hiển thị rõ số lượng người đang còn thiếu tiền mình (Ví dụ: "Có 3 người đang thiếu tiền bạn").

4. QUY TRÌNH XÁC NHẬN TRẢ TIỀN 2 BƯỚC (Dual-Side Confirmation Flow):
Cập nhật Schema/Model trong Database để lưu trạng thái thanh toán giữa Người Trả và Người Nhận:
- Người trả tiền bấm nút "Đã trả": Hệ thống cập nhật trạng thái thành "Chờ xác nhận" và tự động GHI LẠI NGÀY GIỜ bấm (Ví dụ: "Đã trả lúc 14:30 - 11/06"). Việc này giúp chứng minh đã chuyển khoản phòng trường hợp người nhận quên.
- Người nhận tiền (Người được trả) bấm nút "Đã nhận tiền": Trạng thái đổi thành "Đã hoàn thành", số nợ của 2 người này chính thức xóa bỏ/trừ sạch trên hệ thống. 
- Người nhận tiền có quyền ĐƠN PHƯƠNG bấm nút "Đã nhận tiền" để xóa nợ cho người kia ngay lập tức nếu nhận được tiền mặt/chuyển khoản trước.

5. THỜI GIAN TẠO HÓA ĐƠN (Invoice Timestamp):
- Khi người dùng tạo hóa đơn mới (Scan AI hoặc nhập tay), cập nhật Model để lưu chính xác thuộc tính `createdAt` (bao gồm ngày, giờ, phút).
- Hiển thị mốc thời gian này nhỏ phía dưới tên hóa đơn ở trang chi tiết nhóm để người dùng dễ tham chiếu (Ví dụ: "Tạo lúc 09:15 - 10/06/2026").

Hãy rà soát các file schema MongoDB, tạo các Server Actions tương ứng và cập nhật giao diện Tailwind thật trực quan, Scannable rõ ràng. Ghi đè mã nguồn ngay lập tức!
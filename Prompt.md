[CRITICAL UPDATE - SECURITY, LOGIC FIX & PERFORMANCE OPTIMIZATION]
Ứng dụng đang gặp một số lỗi nghiêm trọng về luồng nghiệp vụ và tốc độ phản hồi rất chậm (bị delay 2-3s khi bấm nút). Hãy thực hiện sửa đổi và tối ưu hóa đồng loạt các mục sau theo chuẩn Next.js 16:

1. PHÂN QUYỀN XÓA NHÓM & TÍNH NĂNG RỜI NHÓM (Security & Leave Group):
- XÓA NHÓM: Chỉ cho phép TRƯỞNG NHÓM (creatorId của nhóm trùng với userId hiện tại) nhìn thấy nút xóa và thực hiện quyền xóa nhóm. Các thành viên khác không được phép.
- RỜI NHÓM: Bổ sung nút "Rời nhóm" cho các thành viên thông thường. Trước khi cho rời nhóm, hệ thống BẮT BUỘC phải tính toán số dư của người đó trong nhóm. Nếu số tiền người đó "Cần trả" (Nợ) hoặc "Nhận về" (Tiền người khác nợ mình) KHÁC 0 (chưa sòng phẳng), hệ thống phải chặn lại và báo lỗi: "Bạn phải hoàn thành tất cả khoản nợ hoặc tiền nhận trước khi rời nhóm!". Nếu bằng 0, tiến hành xóa userId khỏi mảng members của nhóm.

2. THAM GIA BẰNG MÃ & UI QR CODE (Join Group via Code):
- Tại trang chi tiết nhóm, hãy hiển thị Mã tham gia (Ví dụ: Mã ID nhóm hoặc một chuỗi code ngắn) nằm NGAY PHÍA DƯỚI của mã QR Code để người dùng dễ nhìn thấy.
- Tại trang Dashboard (`/dashboard`), bổ sung một ô Input nhập mã nhóm và nút "Tham gia bằng mã". Khi người dùng gõ mã và bấm nút, gọi Server Action để thêm userId của họ vào mảng members của nhóm đó, sau đó `revalidatePath('/dashboard')`.

3. CHUẨN HÓA LUỒNG XÁC NHẬN TRẢ NỢ (Fixed Settlement Logic):
Sửa lại logic của các nút bấm quyết toán tiền bạc theo đúng quy trình sau:
- NGƯỜI NHẬN TIỀN (Chủ nợ): Có quyền ĐƠN PHƯƠNG bấm nút "Đã nhận tiền" bất cứ lúc nào. Khi họ bấm, hệ thống sẽ ngay lập tức trừ/xóa sạch số nợ giữa 2 người này về 0 trong Database mà không cần người kia phải gửi yêu cầu trước.
- NGƯỜI TRẢ TIỀN (Con nợ): Khi họ bấm nút "Đã trả", hệ thống chỉ chuyển trạng thái khoản nợ thành "Chờ xác nhận" và ghi lại ngày giờ. Số tiền nợ trên hệ thống CHƯA ĐƯỢC MẤT ĐI cho đến khi Người nhận tiền bấm nút xác nhận.

4. TỐI ƯU HÓA TỐC ĐỘ (Fix 2-3s Latency & App Performance):
Hiện tại app phản hồi rất chậm khi tương tác, hãy tối ưu hóa bằng các kỹ thuật sau:
- MONGODB CONNECTION POOLING: Kiểm tra file kết nối Database (`src/lib/db.ts` hoặc tương đương). Đảm bảo đang sử dụng cơ chế cache lại `cached.conn` và `cached.promise` của Mongoose để không bị tạo lại kết nối mới liên tục ở mỗi lượt gọi Server Action trên Vercel.
- OPTIMISTIC UI / LOADING STATES: Tại tất cả các nút bấm liên quan đến Form hoặc Server Actions (Tạo nhóm, Xóa nhóm, Trả tiền, Nhận tiền), hãy tích hợp trạng thái Loading (Sử dụng `isPending` từ `useTransition` của React hoặc thuộc tính `disabled` khi Form đang submit). Khi người dùng bấm nút, nút đó phải lập tức đổi thành chữ "Đang xử lý..." và bị disabled ngay để tạo cảm giác mượt mà, không cho bấm vô tội vạ.
- Dùng các câu lệnh truy vấn MongoDB có chọn lọc thuộc tính (Dùng `.select()` hoặc projection), tránh lôi toàn bộ dữ liệu thừa làm nặng server.

Hãy rà soát toàn bộ project và triển khai bản vá này ngay lập tức!
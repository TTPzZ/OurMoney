[MASTER ARCHITECTURE, BUGFIX & FEATURE UPGRADE TASK - PROJECT: OURMONEY]
Hãy thực hiện đại tu toàn diện dự án Next.js 16 (Auth.js v5, Mongoose, MongoDB Atlas, Tailwind CSS) để sửa các lỗi hiện tại và bổ sung các tính năng nâng cao. Rà soát và cập nhật đồng loạt các file mã nguồn theo các yêu cầu nghiêm ngặt sau:

1. TỐI ƯU HÓA HIỆU NĂNG & DIỆT LỖI DELAY 2-3S (Crucial Performance Fix):
- MONGODB CONNECTION POOL: Cập nhật file kết nối database (`src/lib/db.ts` hoặc tương đương). BẮT BUỘC triển khai cơ chế Global Cached Connection Pool cho Mongoose theo chuẩn Next.js Serverless (sử dụng global.mongoose để lưu conn và promise). Không được tạo lại kết nối mới ở mỗi request.
- MONGODB LEAN QUERIES: Trong các hàm fetch dữ liệu ở Server Component, thêm `.lean()` vào sau các câu lệnh tìm kiếm của Mongoose (Ví dụ: `Group.findById(id).lean()`) để bỏ qua việc khởi tạo Mongoose Document nặng nề, tăng tốc độ truy vấn.
- NEXT.JS STREAMING: Tạo ngay file `loading.tsx` bên trong thư mục `src/app/dashboard/` và `src/app/group/[id]/`. Giao diện file loading sử dụng hiệu ứng Khung xương giả lập (Skeleton Loader) với hiệu ứng `animate-pulse` của Tailwind CSS để kích hoạt React Suspense, giúp chuyển trang ngay lập tức trong 0.1s thay vì bị đơ màn hình chờ server.
- LOADING STATES TRÊN UI: Tại các nút bấm tương tác (Tạo nhóm, tham gia nhóm, nút xác nhận tiền), sử dụng `useTransition` (`isPending`) hoặc thuộc tính disabled khi form đang submit để lập tức đổi chữ thành "Đang xử lý..." khi người dùng click, ngăn chặn bấm vô tội vạ.

2. SỬA LỖI VỠ AVATAR & TÍNH NĂNG TẢI ẢNH LOCAL (Image Patterns & Base64 Upload):
- NEXT CONFIG: Cập nhật thuộc tính `images.remotePatterns` trong file `next.config.js` (hoặc `next.config.mjs`) để cho phép hiển thị ảnh từ các máy chủ: `lh3.googleusercontent.com` và `ui-avatars.com`.
- LOCAL AVATAR UPLOAD: Tại trang Profile, bổ sung nút "Tải ảnh từ máy lên". Sử dụng FileReader ở Client để mã hóa file ảnh thành chuỗi `Base64 string`. Viết Server Action nhận chuỗi Base64 này và lưu trực tiếp vào trường `image` của User trong MongoDB.
- FALLBACK AVATAR: Cập nhật toàn bộ các thẻ hiển thị Avatar để nhận diện tốt cả link URL Google lẫn chuỗi mã hóa Base64. Nếu ảnh lỗi hoặc trống, tự động fallback về ảnh chữ cái của `ui-avatars.com`.

3. HỆ THỐNG AUTH & ĐỒNG BỘ SESSION (Logout & Dynamic Profile Sync):
- LOGOUT BUTTON: Thêm nút Đăng xuất sử dụng hàm `signOut` từ Auth.js tại Sidebar/Navbar, redirect về trang `/`.
- NEXTAUTH SESSION CALLBACKS: Cấu hình file `src/auth.ts`, tại các hàm callback `jwt` và `session`, bổ sung logic để cập nhật dữ liệu mới nhất (Name và Avatar) từ Database hoặc từ trigger `update`.
- CLIENT SIDE SESSION REFRESH: Tại trang chỉnh sửa hồ sơ, sau khi Server Action cập nhật Tên/Avatar mới vào MongoDB thành công, hãy gọi hàm `update()` từ hook `useSession()` phía client để đồng bộ lại Cookie Session ngay lập tức (sửa lỗi ngoài trang chủ vẫn hiện tên mặc định cũ).

4. QUẢN LÝ NHÓM, RỜI NHÓM & VÁ LỖI THAM GIA BẰNG MÃ (Group Security & Join Fix):
- PHÂN QUYỀN XÓA NHÓM: Chỉ hiển thị nút "Xóa nhóm" và cho phép thực thi Server Action xóa nhóm đối với tài khoản là TRƯỞNG NHÓM (creatorId của nhóm trùng với userId hiện tại).
- TÍNH NĂNG RỜI NHÓM: Bổ sung nút "Rời nhóm" cho thành viên. Trước khi thực hiện xóa userId khỏi mảng members của Group, hệ thống BẮT BUỘC phải tính toán tổng số dư (balance) của thành viên đó trong nhóm. Nếu số tiền họ "Cần trả" (Nợ người khác) hoặc "Nhận về" (Người khác nợ mình) KHÁC 0, phải chặn lại và hiển thị thông báo: "Bạn phải hoàn thành tất cả khoản nợ hoặc tiền nhận trước khi rời nhóm!".
- FIX JOIN CODE LOGIC: Sửa Server Action `joinGroup`. Khi người dùng nhập mã, làm sạch chuỗi bằng `.trim()`. Nếu chuỗi nhập vào khớp định dạng 24 ký tự ObjectId thì tìm nhóm theo `_id`, nếu là chuỗi ngắn thì tìm nhóm theo trường `joinCode` (hoặc `inviteCode`) trong DB. Không được ép mã ngắn vào trường `_id` gây ra lỗi "Mã nhóm không tồn tại".
- DISPLAY CODE: Trên giao diện chi tiết nhóm, hiển thị chuỗi Mã tham gia nhóm này nằm NGAY PHÍA DƯỚI của mã QR Code. Tại Dashboard, thêm ô nhập mã nhóm và nút "Tham gia bằng mã".

5. CHUẨN HÓA LUỒNG QUYẾT TOÁN THÔNG MINH & TIMESTAMP HÓA ĐƠN (Advanced Settlement & Time Logging):
- PHÂN LOẠI MÀU UI: Tại màn hình quyết toán của Nhóm, số tiền MÌNH CẦN TRẢ người khác bắt buộc hiển thị màu ĐỎ (Dạng âm: -50.000đ). Số tiền NGƯỜI KHÁC NỢ MÌNH hiển thị màu XANH LÁ (Dạng dương: +100.000đ). Hiển thị rõ số lượng người đang còn thiếu tiền mình (Ví dụ: "Có X người đang thiếu tiền bạn").
- QUY TRÌNH XÁC NHẬN TRẢ TIỀN 2 BƯỚC:
  + NGƯỜI TRẢ TIỀN (Con nợ): Khi bấm nút "Đã trả", hệ thống chuyển trạng thái khoản nợ thành "Chờ xác nhận", tự động lưu mốc ngày giờ bấm (createdAt/updatedAt) và hiển thị nhỏ phía dưới (Ví dụ: "Đã trả lúc 14:30 - 11/06"). Số tiền nợ trên hệ thống CHƯA ĐƯỢC biến mất.
  + NGƯỜI NHẬN TIỀN (Chủ nợ): Khi họ bấm nút "Xác nhận đã nhận tiền", trạng thái đổi thành "Đã hoàn thành", lúc này số nợ mới chính thức trừ sạch về 0. Người nhận tiền có quyền ĐƠN PHƯƠNG bấm nút này bất cứ lúc nào để xóa nợ cho người kia mà không cần người trả phải gửi yêu cầu trước.
- THỜI GIAN TẠO HÓA ĐƠN: Cập nhật Schema hóa đơn để lưu chính xác trường `createdAt` (bao gồm ngày, giờ, phút). Hiển thị mốc thời gian này nhỏ phía dưới tên hóa đơn ở danh sách hoạt động nhóm để dễ tham chiếu (Ví dụ: "Tạo lúc 09:15 - 11/06/2026").

Hãy tiến hành quét toàn bộ project, tối ưu cấu trúc mã nguồn một cách sạch sẽ, scannable và ghi đè các file ngay lập tức!
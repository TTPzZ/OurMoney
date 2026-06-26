# OurMoney - Agent Boot Instructions

## Đọc file này TRƯỚC TIÊN khi bắt đầu bất kỳ phiên làm việc nào.

### Dự án là gì?
**OurMoney** là ứng dụng web chia tiền nhóm (split bills) cho bạn bè. Người dùng đăng nhập bằng Google, tạo nhóm, mời bạn bè qua QR code, thêm hóa đơn, chia tiền tự động hoặc tùy chỉnh, và xem ai nợ ai bao nhiêu thông qua thuật toán Minimum Cash Flow.

### Trước khi viết code
1. Đọc `.agents/context/architecture.md` → hiểu kiến trúc tổng thể
2. Đọc `.agents/context/database-schema.md` → hiểu cấu trúc dữ liệu
3. Đọc `.agents/rules/coding-standards.md` → tuân thủ quy tắc code
4. Đọc `.agents/rules/naming-conventions.md` → đặt tên đúng chuẩn
5. Đọc `.agents/PROGRESS.md` → biết dự án đang ở đâu, cần làm gì tiếp

### Trước khi thêm feature mới
1. Đọc `.agents/workflows/feature-driven.md` → quy trình phát triển
2. Kiểm tra `PROGRESS.md` → xem feature đó thuộc phase nào
3. Đọc `.agents/context/architecture.md` → xác định file nào cần tạo/sửa

### Quy tắc vàng
- **KHÔNG BAO GIỜ** sửa business logic chia tiền (`simplifyDebts`) mà không có yêu cầu rõ ràng
- **KHÔNG BAO GIỜ** thay đổi database schema mà không cập nhật `database-schema.md`
- **LUÔN** dùng Server Components trừ khi cần interactivity
- **LUÔN** kiểm tra auth trước khi thao tác dữ liệu
- **LUÔN** cập nhật `PROGRESS.md` sau khi hoàn thành task

### Tech stack nhanh
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- MongoDB/Mongoose + Auth.js (Google OAuth)
- SWR (client-side caching) + localStorage (cache-first strategy)
- Gemini AI (OCR hóa đơn) + QR Code (mời nhóm)
- Deploy: Vercel (region: sin1 - Singapore)

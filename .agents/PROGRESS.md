# OurMoney - Progress Tracker

> **Cập nhật lần cuối:** 2026-06-26  
> **Tổng tiến độ:** ~80% hoàn thành  
> **Phase hiện tại:** Đang ở giữa Phase 2 → Phase 3

---

## Roadmap tổng thể

| Phase | Tên | Trạng thái | Tiến độ |
|-------|-----|------------|---------|
| 1 | Foundation & Authentication | ✅ Hoàn thành | 100% |
| 2 | Group Management & Manual Bills | ✅ Hoàn thành | 100% |
| 2.5 | Performance & Cache-First UX | ✅ Hoàn thành | 100% |
| 3 | OCR/AI Integration & Polish | 🔧 Đang làm | ~60% |
| 4 | PWA & Advanced Features | ⏳ Chưa bắt đầu | 0% |

---

## Phase 1: Foundation & Authentication ✅

### Đã hoàn thành
- [x] Next.js 16 boilerplate + Tailwind CSS v4 + TypeScript strict
- [x] MongoDB Atlas connection (cached connection pattern)
- [x] Auth.js (NextAuth v5) với Google OAuth Provider
- [x] User model: googleId, googleName, googleImage, customName, customImage
- [x] Landing page + Google Sign-in button
- [x] Dashboard shell (layout + routing)
- [x] Protected routes (redirect nếu chưa login)
- [x] Session management (JWT strategy)
- [x] Security headers (X-Frame-Options, CSP basics)
- [x] Vercel deployment (region: sin1)

---

## Phase 2: Group Management & Manual Bills ✅

### Đã hoàn thành
- [x] **Group CRUD**
  - [x] Tạo nhóm mới (nanoid inviteCode)
  - [x] Xem danh sách nhóm (member count)
  - [x] Xem chi tiết nhóm (members, bills, settlements)
  - [x] Xóa nhóm (chỉ creator/trưởng nhóm)
  - [x] Rời nhóm (kiểm tra hết nợ trước)

- [x] **Invite System**
  - [x] QR Code generation (qrcode.react)
  - [x] Copy invite link
  - [x] Share invite (Web Share API)
  - [x] Join via URL `/join/[code]` (auto-join nếu đã login)
  - [x] Join CHỈ bằng inviteCode (bảo mật)

- [x] **Bill Management**
  - [x] Tạo bill manual (description, totalAmount, paidBy, splits)
  - [x] Chia đều (split equally)
  - [x] Chia tùy chỉnh (custom amounts per member)
  - [x] Chọn members tham gia bill
  - [x] Bill list với detail modal
  - [x] AddBillForm trong modal (AddBillModal)
  - [x] AddBillForm standalone route (/group/[id]/add-bill)

- [x] **Settlement (Quyết toán)**
  - [x] Thuật toán Minimum Cash Flow (simplifyDebts)
  - [x] Hiển thị "Cần trả" / "Cần nhận" summary
  - [x] Flow "Đã trả" → "Xác nhận" (2 bước)
  - [x] Flow "Đã nhận tiền" (xác nhận trực tiếp, 1 bước)
  - [x] Pending settlement indicator (Clock icon)

- [x] **Profile Management**
  - [x] Xem/sửa tên hiển thị (customName)
  - [x] Upload avatar tùy chỉnh (base64)
  - [x] Khôi phục tên/ảnh Google gốc
  - [x] Avatar API endpoint (/api/user/avatar)
  - [x] Gemini API Key management

- [x] **SPA Shell (MoneyClientShell)**
  - [x] Client-side navigation (pushState)
  - [x] Dashboard ↔ Group ↔ Profile không full reload
  - [x] Popstate listener cho browser back/forward
  - [x] URL sync với shell state

---

## Phase 2.5: Performance & Cache-First UX ✅

### Đã hoàn thành
- [x] Xóa aggressive group preload (loại bỏ request storm)
- [x] Dashboard cache-first (localStorage + SWR)
- [x] Group detail cache-first (localStorage + SWR)
- [x] Profile cache-first (useCurrentUser hook)
- [x] Stale-While-Revalidate UX (hiển thị cache → fetch nền)
- [x] Optimistic group navigation (mở group ngay từ cache)
- [x] Optimistic bill creation (cập nhật cache → đóng modal)
- [x] Subtle revalidating indicator (pulse dot khi fetch nền)
- [x] Performance logging (API timing, DB connection, query timing)
- [x] Database indexes audit (tất cả OK)

---

## Phase 3: OCR/AI Integration & Polish 🔧

### Đã hoàn thành
- [x] **Gemini AI OCR**
  - [x] API route `/api/ocr` (POST) 
  - [x] Sử dụng Gemini 2.5 Flash model
  - [x] Prompt engineering: extract merchant, items, totalAmount
  - [x] User-specific Gemini API Key (từ profile)
  - [x] Error handling: model not found, quota exceeded, parse error
  - [x] Scan source tracking: `scanSource: 'ai'` trên Bill

- [x] **AddBillForm AI Integration**
  - [x] Camera/upload ảnh hóa đơn
  - [x] Gửi ảnh → AI OCR → extract items
  - [x] Auto-fill form từ AI result
  - [x] Bill image preview + zoom modal
  - [x] Scan source badge (📄 OCR / ✨ AI) trên bill list

- [x] **UI Polish**
  - [x] Fix nút "Xác nhận" (xóa sticky footer trắng)
  - [x] Submit loading bao trùm toàn bộ flow (create → cache → close)
  - [x] onSuccess async pattern
  - [x] Disable form khi submitting
  - [x] Bill detail modal (với split breakdown, payer highlight)
  - [x] Bill image full-screen view

### Chưa hoàn thành
- [ ] **OCR Thường (Tesseract.js fallback)**
  - [ ] Fallback OCR khi user không có Gemini key
  - [ ] Package `tesseract.js` đã install nhưng chưa integrate
  - [ ] Package `ppu-paddle-ocr` đã install nhưng chưa integrate
  - [ ] Package `onnxruntime-web` đã install nhưng chưa integrate
  - [ ] Debug page `src/app/debug/ocr/` tồn tại nhưng chưa có nội dung

- [ ] **Item-level Splitting (Chia theo món)**
  - [ ] Sau khi OCR/AI extract items → hiển thị danh sách items
  - [ ] Cho phép members chọn/claim items họ ăn
  - [ ] Tự động tính split amounts từ claimed items
  - [ ] UI cho item selection (checkboxes per member per item)

- [ ] **Bill Edit/Delete**
  - [ ] Sửa hóa đơn đã tạo
  - [ ] Xóa hóa đơn
  - [ ] Permission: chỉ người tạo bill hoặc group creator

- [ ] **Notifications/History**
  - [ ] Lịch sử settlements đã completed
  - [ ] Hiển thị ai đã xác nhận thanh toán khi nào

---

## Phase 4: PWA & Advanced Features ⏳

### Chưa bắt đầu
- [ ] **PWA**
  - [ ] Service Worker registration
  - [ ] Offline support
  - [ ] Install prompt
  - [ ] Push notifications
  - [x] manifest.json (đã có nhưng chưa có icons thật)
  - [ ] App icons 192x192, 512x512

- [ ] **UX Improvements**
  - [ ] Dark mode support
  - [ ] Skeleton loading cho tất cả pages (dashboard đã có)
  - [ ] Pull-to-refresh (mobile)
  - [ ] Swipe actions (swipe to delete bill?)
  - [ ] Haptic feedback (vibrate on actions)

- [ ] **Advanced Features**
  - [ ] Recurring bills
  - [ ] Bill categories/tags
  - [ ] Export/share settlement summary
  - [ ] Multi-currency support
  - [ ] Group statistics/charts
  - [ ] Transfer group ownership

- [ ] **Code Quality**
  - [ ] Unit tests cho simplifyDebts
  - [ ] E2E tests (Playwright?)
  - [ ] Error boundary components
  - [ ] Rate limiting cho API routes
  - [ ] Input validation (Zod?)
  - [ ] Clean up legacy files: `GroupList.tsx`, `SettlementView.tsx`

---

## Các file cần lưu ý (Legacy/Unused)

| File | Trạng thái | Ghi chú |
|------|------------|---------|
| `src/components/GroupList.tsx` | ⚠️ Legacy | Không dùng, logic đã merge vào DashboardClient |
| `src/components/SettlementView.tsx` | ⚠️ Legacy | Không dùng, logic đã merge vào GroupClient |
| `src/app/debug/ocr/` | ⚠️ Empty | Placeholder cho debug OCR |
| `Fix OCR P5.md` | ⚠️ Empty | File trống ở root |
| `Prompt.2md` | 📄 Reference | Prompt hướng dẫn fix UI lần trước |
| `phase.md`, `phase2.md` | 📄 Reference | Tài liệu phase cũ (đã thực hiện) |
| `plan.md`, `skill.md`, `ai_rules.md`, `database.md` | 📄 Reference | Tài liệu gốc ban đầu |

---

## Known Issues & Tech Debt

1. **AddBillForm quá lớn** (34KB, ~800+ lines) → cần tách thành components nhỏ hơn
2. **Avatar base64 storage** → đang lưu trực tiếp trong MongoDB, nên chuyển sang cloud storage
3. **No input validation library** → nên thêm Zod cho form validation
4. **Console.log/timing logs** → nên dọn dẹp cho production
5. **Error handling inconsistent** → mix giữa alert() và inline errors
6. **No rate limiting** → API routes có thể bị abuse
7. **Unused packages** → `tesseract.js`, `ppu-paddle-ocr`, `onnxruntime-web` đã install nhưng chưa dùng
8. **Google auth thay Facebook** → plan ban đầu dùng Facebook, đã chuyển sang Google nhưng `database.md` gốc vẫn ghi Facebook

---

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Auth.js
AUTH_SECRET=...

# Google OAuth
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

> **Lưu ý:** Gemini API Key được mỗi user tự quản lý trong Profile, KHÔNG phải env variable.

---

## Gợi ý cho phiên làm việc tiếp theo

### Priority 1 (Nên làm tiếp)
1. **Item-level splitting** → Feature quan trọng nhất còn thiếu
2. **Bill Edit/Delete** → Cần thiết cho UX
3. **Tách AddBillForm** → Refactor file quá lớn

### Priority 2 (Nice to have)
4. **Tesseract.js fallback OCR** → Cho user không có Gemini key
5. **Settlement history** → Xem lịch sử thanh toán
6. **Clean up legacy files** → Dọn code

### Priority 3 (Tương lai)
7. **PWA completion** → Service Worker, offline, install
8. **Dark mode** → User preference
9. **Tests** → Unit tests cho business logic

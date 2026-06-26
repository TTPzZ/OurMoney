# Database Schema (MongoDB + Mongoose)

## Tổng quan

Dự án sử dụng **MongoDB Atlas** với **Mongoose ODM**. Có 4 collections chính.
Tất cả models nằm trong `src/models/`.

---

## 1. User (`users`)

**File:** `src/models/User.ts`  
**Interface:** `IUser`

| Field | Type | Constraints | Mô tả |
|-------|------|-------------|-------|
| `_id` | ObjectId | auto | Primary key |
| `name` | String | required, trim, maxlength(50) | Tên hiển thị (ưu tiên customName → googleName) |
| `email` | String | unique, sparse | Email (từ Google) |
| `image` | String | - | URL avatar hiện tại (custom hoặc Google) |
| `googleId` | String | unique, required | Google OAuth sub ID |
| `googleName` | String | default: null | Tên gốc từ Google |
| `googleImage` | String | default: null | Avatar gốc từ Google |
| `customName` | String | default: null | Tên do user tự đặt |
| `customImage` | String | default: null | Avatar do user upload (base64) |
| `geminiApiKey` | String | default: null | API Key Gemini của user (cho AI OCR) |
| `createdAt` | Date | auto (timestamps) | Ngày tạo |
| `updatedAt` | Date | auto (timestamps) | Ngày cập nhật cuối |

**Indexes:**
- `{ googleId: 1 }` — unique
- `{ email: 1 }` — unique, sparse

**Logic hiển thị user:**
```
displayName = customName || googleName || name || email || "User"
displayImage = customImage || googleImage || image
```

**PublicUser projection:** `"name image googleName googleImage customName customImage geminiApiKey createdAt updatedAt"`

---

## 2. Group (`groups`)

**File:** `src/models/Group.ts`  
**Interface:** `IGroup`

| Field | Type | Constraints | Mô tả |
|-------|------|-------------|-------|
| `_id` | ObjectId | auto | Primary key |
| `name` | String | required, trim, maxlength(80) | Tên nhóm |
| `createdBy` | ObjectId (ref: User) | required | Người tạo nhóm (trưởng nhóm) |
| `members` | ObjectId[] (ref: User) | - | Danh sách thành viên |
| `inviteCode` | String | unique, required | Mã mời (nanoid 10 chars) |
| `createdAt` | Date | default: Date.now | Ngày tạo |

**Indexes:**
- `{ members: 1, createdAt: -1 }` — tìm nhóm theo user, sort mới nhất
- `{ inviteCode: 1 }` — unique

**Business rules:**
- Chỉ `createdBy` (trưởng nhóm) mới được xóa nhóm
- Trưởng nhóm không thể rời nhóm (phải xóa nhóm)
- Thành viên phải hoàn thành tất cả nợ trước khi rời nhóm
- Join nhóm CHỈ bằng `inviteCode`, KHÔNG bằng groupId

---

## 3. Bill (`bills`)

**File:** `src/models/Bill.ts`  
**Interface:** `IBill`, `IBillSplit`

| Field | Type | Constraints | Mô tả |
|-------|------|-------------|-------|
| `_id` | ObjectId | auto | Primary key |
| `groupId` | ObjectId (ref: Group) | required | Nhóm chứa hóa đơn |
| `description` | String | required, trim, maxlength(100) | Mô tả (VD: "Lẩu Thái") |
| `totalAmount` | Number | required | Tổng số tiền |
| `paidBy` | ObjectId (ref: User) | required | Người đã trả tiền |
| `splits` | Array | - | Phân chia chi phí |
| `splits[].userId` | ObjectId (ref: User) | - | User được chia |
| `splits[].amount` | Number | required | Số tiền user này phải trả |
| `imageUrl` | String | optional | Ảnh hóa đơn (base64) |
| `scanSource` | String | enum: ['ocr', 'ai'], default: null | Nguồn scan (OCR thường hoặc AI) |
| `createdAt` | Date | default: Date.now | Ngày tạo |

**Indexes:**
- `{ groupId: 1, createdAt: -1 }` — lấy bills theo nhóm, sort mới nhất
- `{ paidBy: 1 }` — tìm bills theo người trả

**Business rules:**
- `sum(splits[].amount)` phải bằng `totalAmount`
- Query giới hạn 50 bills gần nhất per group
- Bills populated với user info khi trả về client

---

## 4. Settlement (`settlements`)

**File:** `src/models/Settlement.ts`  
**Interface:** `ISettlement`

| Field | Type | Constraints | Mô tả |
|-------|------|-------------|-------|
| `_id` | ObjectId | auto | Primary key |
| `groupId` | ObjectId (ref: Group) | required | Nhóm |
| `from` | ObjectId (ref: User) | required | Người trả nợ |
| `to` | ObjectId (ref: User) | required | Người nhận tiền |
| `amount` | Number | required | Số tiền thanh toán |
| `status` | String | enum: ['pending', 'completed'], default: 'pending' | Trạng thái |
| `paidAt` | Date | optional | Thời điểm người nợ bấm "Đã trả" |
| `completedAt` | Date | optional | Thời điểm người nhận xác nhận |

**Indexes:**
- `{ groupId: 1, status: 1 }` — lọc settlements theo nhóm + trạng thái
- `{ groupId: 1, from: 1, to: 1 }` — tìm settlement giữa 2 user

**Settlement flows:**

### Flow 1: 2 bước (Đã trả → Xác nhận)
```
A nợ B 100k
A click "Đã trả" → Settlement(from: A, to: B, amount: 100k, status: pending, paidAt: now)
B click "Xác nhận" → Settlement.status = completed, completedAt = now
```

### Flow 2: 1 bước (Xác nhận trực tiếp)
```
A nợ B 100k  
B click "Đã nhận tiền" → Settlement(from: A, to: B, amount: 100k, status: completed, paidAt: now, completedAt: now)
```

---

## Quan hệ giữa các collections

```
User (1) ──────────< Group.members (N)
User (1) ──────────< Group.createdBy (1)
User (1) ──────────< Bill.paidBy (1)
User (1) ──────────< Bill.splits[].userId (N)
User (1) ──────────< Settlement.from (1)
User (1) ──────────< Settlement.to (1)
Group (1) ─────────< Bill (N)
Group (1) ─────────< Settlement (N)
```

---

## Thuật toán Minimum Cash Flow

**File:** `src/lib/utils/debt.ts`  
**Function:** `simplifyDebts(bills, memberIds, completedSettlements)`

```
Input:
  - bills: { paidBy, totalAmount, splits: { userId, amount }[] }[]
  - memberIds: string[]
  - completedSettlements: { from, to, amount }[]

Algorithm:
  1. Tính net balance cho mỗi member:
     balance[payer] += totalAmount
     balance[debtor] -= split.amount
     balance[from] += completedSettlement.amount  (đã trả → giảm nợ)
     balance[to] -= completedSettlement.amount
  
  2. Tách thành creditors (balance > 0.01) và debtors (balance < -0.01)
  
  3. Sort cả hai theo amount giảm dần
  
  4. Greedy matching:
     settleAmount = min(creditor.amount, debtor.amount)
     transactions.push({ from: debtor, to: creditor, amount: round(settleAmount, 2) })

Output: Transaction[] { from, to, amount }
```

**Lưu ý quan trọng:**
- Floating-point: dùng epsilon 0.01 để so sánh
- Round to 2 decimal places khi tạo transaction
- Đây là thuật toán CRITICAL, không được sửa nếu không test kỹ

---

## MongoDB Connection

**File:** `src/lib/db.ts`

- Sử dụng **global cache** pattern cho Mongoose connection
- Dev: connection được cache trong `global.mongoose` để tránh tạo mới mỗi hot reload
- Prod: connection pool tự quản lý bởi Mongoose
- Option: `bufferCommands: false` để fail fast nếu chưa connect

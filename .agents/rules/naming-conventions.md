# Naming Conventions

## Files & Directories

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Pages (App Router) | `page.tsx`, `layout.tsx`, `loading.tsx` | `src/app/dashboard/page.tsx` |
| Client Components | PascalCase | `DashboardClient.tsx`, `GroupClient.tsx` |
| Server Actions | camelCase | `src/lib/actions/group.ts` |
| API Routes | `route.ts` | `src/app/api/groups/route.ts` |
| Mongoose Models | PascalCase (singular) | `User.ts`, `Group.ts`, `Bill.ts` |
| Utilities | kebab-case | `current-user.ts`, `money-types.ts` |
| Hooks | `use-` prefix, kebab-case | `use-current-user.ts` |
| UI Components | PascalCase | `Button.tsx`, `Card.tsx`, `Input.tsx` |
| Test files | `.test.ts` suffix | `current-user.test.ts` |

## Variables & Functions

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Components | PascalCase | `DashboardClient`, `AddBillForm` |
| Functions | camelCase | `createGroup`, `handleSubmit` |
| Server Actions | camelCase | `createBill`, `markAsPaid` |
| Hooks | `use` prefix + camelCase | `useCurrentUser` |
| Constants | UPPER_SNAKE_CASE | `GROUPS_CACHE_KEY`, `USER_PUBLIC_SELECT` |
| Interfaces | `I` prefix (Mongoose) | `IUser`, `IGroup`, `IBill` |
| Type exports | PascalCase (no prefix) | `PublicUser`, `GroupDetail`, `BillWithPayer` |
| Event handlers | `handle` prefix | `handleSubmit`, `handleBillCreated` |
| Props interfaces | ComponentName + `Props` | `AddBillModalProps` |

## Cache Keys

| Key | Pattern | Ví dụ |
|-----|---------|-------|
| Groups list | `ourmoney_groups_cache` | localStorage key |
| Group detail | `ourmoney_group_{groupId}` | localStorage key |
| Profile | `ourmoney_profile_cache` | localStorage key |
| SWR groups | `/api/groups` | SWR cache key |
| SWR group detail | `/api/groups/{id}` | SWR cache key |
| SWR profile | `/api/me` | SWR cache key |

## API Routes

| Route | Method | Pattern | Mô tả |
|-------|--------|---------|-------|
| `/api/groups` | GET | Collection | Danh sách nhóm |
| `/api/groups/[id]` | GET | Resource | Chi tiết nhóm |
| `/api/me` | GET, PATCH | Singleton | Profile hiện tại |
| `/api/ocr` | POST | Action | Scan hóa đơn |
| `/api/user/avatar` | GET | Resource | Avatar image |
| `/api/auth/*` | * | Auth.js | Authentication |

## Database Collections & Fields

| Collection | Mongoose Model | Naming |
|------------|---------------|--------|
| `users` | `User` | camelCase fields: `googleId`, `customName` |
| `groups` | `Group` | camelCase fields: `createdBy`, `inviteCode` |
| `bills` | `Bill` | camelCase fields: `groupId`, `totalAmount`, `paidBy` |
| `settlements` | `Settlement` | camelCase fields: `groupId`, `paidAt`, `completedAt` |

## UI Text (Vietnamese)

- Buttons: Động từ ngắn gọn — "Xác nhận", "Đã trả", "Đã nhận tiền", "Lưu thay đổi"
- Labels: Danh từ — "Tên nhóm", "Tổng số tiền", "Người trả tiền"
- Meta text: ALL CAPS tracking-widest — "CẦN TRẢ", "CẦN NHẬN", "THÀNH VIÊN"
- Errors: Câu đầy đủ — "Bạn phải hoàn thành tất cả khoản nợ trước khi rời nhóm!"
- Placeholder: Ví dụ cụ thể — 'Ví dụ: "Ăn trưa", "Du lịch Đà Lạt"'

## CSS Classes Pattern

```
// Card
"bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"

// Section title (label)
"text-[10px] font-bold text-slate-400 uppercase tracking-widest"

// Primary button
"bg-indigo-600 text-white rounded-2xl px-6 py-4 font-bold shadow-xl"

// Page background
"min-h-screen bg-slate-50 flex flex-col items-center p-4 pb-32"

// Avatar container
"w-{size} h-{size} rounded-full overflow-hidden border-2 border-white shadow-xl bg-slate-200"

// Modal overlay
"fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"

// Modal content
"max-h-[90vh] w-full max-w-xl rounded-3xl bg-slate-50 shadow-2xl"
```

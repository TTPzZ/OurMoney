# Kiến trúc hệ thống OurMoney

## Tổng quan

OurMoney là một **Next.js 16 App Router** web application, thiết kế theo kiến trúc **Mobile-first PWA**. Ứng dụng sử dụng mô hình **SPA-like Shell** với client-side navigation, kết hợp **Server Components** cho SEO/initial load và **Client Components** cho interactivity.

---

## Sơ đồ kiến trúc

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                      │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  RootLayout (Server)                                     │  │
│  │  ├── Providers (Client) [SessionProvider + SWRConfig]    │  │
│  │  │                                                       │  │
│  │  │  ┌── Landing Page (/)           [Server Component]    │  │
│  │  │  ├── MoneyClientShell (/dashboard) [SPA Shell]        │  │
│  │  │  │   ├── DashboardClient       [Group List View]      │  │
│  │  │  │   ├── GroupClient            [Group Detail View]   │  │
│  │  │  │   └── ProfileClient          [Profile View]        │  │
│  │  │  ├── JoinPage (/join/[code])    [Server Component]    │  │
│  │  │  └── AddBillPage (standalone)   [Server Component]    │  │
│  │  └─────────────────────────────────────────────────────┘  │
│  │                                                            │
│  │  Cache Layer: SWR + localStorage (Stale-While-Revalidate) │
│  └────────────────────────────────────────────────────────────┘
│                              │
│                  API Calls (fetch)
│                              │
├──────────────────────────────┼────────────────────────────────┤
│                         SERVER                                 │
│                                                                │
│  ┌── API Routes (/api/*)                                      │
│  │   ├── /api/groups          → GET danh sách nhóm            │
│  │   ├── /api/groups/[id]     → GET chi tiết nhóm + bills     │
│  │   ├── /api/me              → GET/PATCH profile user        │
│  │   ├── /api/ocr             → POST scan hóa đơn (Gemini)   │
│  │   ├── /api/user/avatar     → GET avatar (base64 → image)  │
│  │   └── /api/auth/*          → Auth.js handlers             │
│  │                                                             │
│  ├── Server Actions (/lib/actions/*)                           │
│  │   ├── group.ts  → createGroup, joinGroupByCode, delete...  │
│  │   ├── bill.ts   → createBill, getBillsByGroupId            │
│  │   ├── settlement.ts → markAsPaid, confirmReceived, direct  │
│  │   └── user.ts   → updateUserProfile, updateGeminiKey       │
│  │                                                             │
│  ├── Queries (/lib/queries.ts)  → Read-only DB queries         │
│  │                                                             │
│  └── Auth (/auth.ts)  → NextAuth v5 + Google OAuth           │
│                              │
│                      Mongoose ODM
│                              │
│  ┌───────────────────────────┴────────────────────────────┐   │
│  │              MongoDB Atlas (Cloud)                      │   │
│  │   Collections: users, groups, bills, settlements        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─────────────── External Services ───────────────────────┐   │
│  │   Google OAuth 2.0          (Authentication)            │   │
│  │   Google Gemini 2.5 Flash   (OCR / AI Bill Scanning)    │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## Cấu trúc thư mục

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, metadata, Providers)
│   ├── page.tsx                  # Landing page + Google Sign-in
│   ├── globals.css               # Tailwind v4 imports + CSS variables
│   │
│   ├── dashboard/                # Dashboard route
│   │   ├── page.tsx              # Server: fetch groups → pass to shell
│   │   ├── DashboardClient.tsx   # Client: danh sách nhóm + cache
│   │   ├── MoneyClientShell.tsx  # Client: SPA shell (dashboard/group/profile)
│   │   └── loading.tsx           # Skeleton loading
│   │
│   ├── group/[id]/               # Group detail route
│   │   ├── page.tsx              # Server: fetch group+bills+settlements
│   │   ├── GroupClient.tsx       # Client: UI nhóm + settlements + bills
│   │   ├── add-bill/page.tsx     # Standalone add bill page
│   │   └── loading.tsx           # Skeleton loading
│   │
│   ├── join/[code]/page.tsx      # Server: auto-join group by invite code
│   ├── profile/                  # Profile route
│   │   ├── page.tsx              # Server: fetch user
│   │   └── ProfileClient.tsx     # Client: edit name/avatar/gemini key
│   │
│   ├── api/                      # API Route Handlers
│   │   ├── auth/[...nextauth]/   # Auth.js catch-all
│   │   ├── groups/route.ts       # GET /api/groups
│   │   ├── groups/[id]/route.ts  # GET /api/groups/[id]
│   │   ├── me/route.ts           # GET/PATCH /api/me
│   │   ├── ocr/route.ts          # POST /api/ocr (Gemini AI)
│   │   └── user/avatar/route.ts  # GET avatar image
│   │
│   └── debug/ocr/                # Debug OCR (dev only)
│
├── components/                   # React Components
│   ├── AddBillForm.tsx           # Form tạo hóa đơn (manual + AI scan)
│   ├── AddBillModal.tsx          # Modal wrapper cho AddBillForm
│   ├── Avatar.tsx                # Avatar component
│   ├── ActionButton.tsx          # Button with async action + loading
│   ├── BillList.tsx              # Danh sách hóa đơn + detail modal
│   ├── CreateGroupModal.tsx      # Modal tạo nhóm mới
│   ├── GroupInviteQR.tsx         # QR code mời nhóm + share
│   ├── GroupList.tsx             # (legacy, không dùng nữa)
│   ├── GroupMembersDialog.tsx    # Dialog xem thành viên nhóm
│   ├── Providers.tsx             # SessionProvider + SWRConfig
│   ├── SettlementView.tsx        # (legacy, tích hợp vào GroupClient)
│   └── ui/                       # Primitive UI components
│       ├── Button.tsx            # Button with variants + loading
│       ├── Card.tsx              # Card container
│       ├── Input.tsx             # Input with label
│       └── Section.tsx           # Section with title + icon
│
├── lib/                          # Shared logic
│   ├── actions/                  # Server Actions ("use server")
│   │   ├── bill.ts
│   │   ├── group.ts
│   │   ├── settlement.ts
│   │   └── user.ts
│   ├── utils/
│   │   └── debt.ts               # ⭐ simplifyDebts (Minimum Cash Flow)
│   ├── current-user.ts           # PublicUser type + helpers
│   ├── db.ts                     # MongoDB connection (cached)
│   ├── fetcher.ts                # SWR fetcher
│   ├── money-shell-state.ts      # SPA shell state management
│   ├── money-types.ts            # TypeScript types/interfaces
│   ├── queries.ts                # DB query functions with timing
│   └── use-current-user.ts       # Hook: current user with SWR + cache
│
├── models/                       # Mongoose Models
│   ├── User.ts
│   ├── Group.ts
│   ├── Bill.ts
│   └── Settlement.ts
│
└── auth.ts                       # Auth.js configuration
```

---

## Luồng dữ liệu chính

### 1. Authentication Flow
```
User → Landing Page → Click "Đăng nhập Google"
    → Google OAuth → Callback
    → Auth.js signIn callback:
        - Tìm user bằng googleId
        - Nếu chưa có → tạo User mới
        - Nếu có → cập nhật googleName/googleImage nếu thay đổi
    → JWT callback: gắn userId, name, picture vào token
    → Session callback: expose userId, name, image cho client
    → Redirect → /dashboard
```

### 2. SPA Shell Navigation (MoneyClientShell)
```
/dashboard → MoneyClientShell (entry point)
    ├── view: "dashboard" → DashboardClient
    ├── view: "group"     → GroupClient (groupId)
    └── view: "profile"   → ProfileClient

Navigation = setState + window.history.pushState (không full page reload)
Popstate listener để sync URL ↔ shell state
```

### 3. Cache-First Data Strategy (Stale-While-Revalidate)
```
Mở Dashboard:
    1. Đọc localStorage (ourmoney_groups_cache)
    2. Hiển thị cache NGAY LẬP TỨC
    3. SWR fetch /api/groups ở background
    4. Khi có data mới → cập nhật UI + localStorage

Mở Group Detail:
    1. Đọc localStorage (ourmoney_group_{id})
    2. Hiển thị cache ngay
    3. SWR fetch /api/groups/{id} ở background
    4. Cập nhật UI + localStorage khi có data mới

Tạo Bill:
    1. Server Action createBill
    2. SWR mutate group detail
    3. Cập nhật localStorage cache
    4. Đóng modal SAU KHI data đã refresh
```

### 4. Settlement Flow (Minimum Cash Flow)
```
Bills → simplifyDebts(bills, memberIds, completedSettlements)
    → Tính net balance cho mỗi thành viên
    → Tách thành creditors (dư) và debtors (nợ)
    → Greedy matching: debtor trả cho creditor
    → Output: Transaction[] { from, to, amount }

Marking as paid:
    A click "Đã trả" → tạo Settlement(status: pending)
    B click "Xác nhận" → Settlement.status = completed
    
    HOẶC:
    B click "Đã nhận tiền" → tạo Settlement(status: completed) trực tiếp
```

---

## Các pattern quan trọng

### Server Component vs Client Component
| Loại | Khi nào dùng | Ví dụ |
|------|-------------|-------|
| Server Component | Fetch initial data, SEO, auth check | `page.tsx`, `layout.tsx` |
| Client Component | State, events, hooks, animation | `DashboardClient.tsx`, `GroupClient.tsx` |

### Data Fetching Patterns
| Pattern | Ở đâu | Cách dùng |
|---------|-------|-----------|
| Server-side fetch | `page.tsx` files | `await getGroupsForUser()` → pass as props |
| Client SWR | Client components | `useSWR("/api/groups", fetcher)` |
| Server Actions | Form submissions | `"use server"` + `createBill()` |
| API Routes | Client fetch | `/api/groups`, `/api/me`, `/api/ocr` |

### Security Pattern
Mọi endpoint đều phải:
1. `const session = await auth()` → kiểm tra đăng nhập
2. `Group.exists({ _id: groupId, members: session.user.id })` → kiểm tra membership
3. Không expose internal IDs ngoài scope cần thiết

---

## Deploy Configuration
- **Platform:** Vercel
- **Region:** `sin1` (Singapore) - gần Việt Nam
- **Environment Variables:** xem `.env.local.example`
- **PWA:** manifest.json đã cấu hình (standalone, portrait)
- **Security Headers:** X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

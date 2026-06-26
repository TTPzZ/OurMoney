# Feature-Driven Workflow

## Quy trình phát triển feature mới

Tuân thủ quy trình này khi thêm bất kỳ feature nào vào OurMoney.

---

## Bước 1: Xác định scope

1. Feature thuộc **Phase nào**? (xem PROGRESS.md)
2. Feature **ảnh hưởng** đến components/files nào?
3. Có cần **thay đổi database schema** không?
4. Có cần **API route mới** không?

### Checklist trước khi bắt đầu
- [ ] Đọc PROGRESS.md để biết context hiện tại
- [ ] Đọc architecture.md để hiểu cấu trúc
- [ ] Xác định files cần tạo/sửa
- [ ] Nếu đổi DB schema → cập nhật database-schema.md TRƯỚC

---

## Bước 2: Backend First

### 2.1 Database (nếu cần)
```
1. Tạo/sửa Mongoose Model trong src/models/
2. Thêm indexes phù hợp
3. Cập nhật database-schema.md
```

### 2.2 Server Actions hoặc API Routes
```
Quyết định dùng gì:
  - Server Action: cho mutations (create, update, delete)
  - API Route: cho data fetching từ client (SWR)
  
Pattern bắt buộc:
  1. Check auth: const session = await auth()
  2. Check authorization (membership)
  3. Validate input
  4. Execute logic
  5. Return result / revalidatePath
```

### 2.3 Query Functions (nếu cần)
```
Nếu cần query mới cho data fetching:
  → Thêm vào src/lib/queries.ts
  → Bao timer logging: console.time/timeEnd
  → Serialize result: JSON.parse(JSON.stringify(...))
```

---

## Bước 3: Frontend

### 3.1 Server Component (page.tsx)
```
Mỗi page.tsx nên:
  1. Check auth → redirect nếu chưa login
  2. Fetch initial data (server-side)
  3. Pass data xuống Client Component
```

### 3.2 Client Component
```
Pattern chuẩn:
  1. Nhận initialData qua props
  2. useSWR với fallbackData = localStorage cache hoặc initialData
  3. localStorage cache cho instant UI
  4. Handle mutations → mutate SWR → update cache
```

### 3.3 UI Components
```
Sử dụng primitive UI components có sẵn:
  - Button (src/components/ui/Button.tsx)
  - Card (src/components/ui/Card.tsx)
  - Input (src/components/ui/Input.tsx)
  - Section (src/components/ui/Section.tsx)
  - Avatar (src/components/Avatar.tsx)
  - ActionButton (src/components/ActionButton.tsx)
  
Design system:
  - Mobile-first (max-w-md cho content)
  - Touch-friendly (min 44px targets)
  - Indigo-600 là brand color
  - slate-50 background, white cards
```

---

## Bước 4: Cache Integration

### Checklist cache
- [ ] SWR key đã đặt đúng pattern? (`/api/...`)
- [ ] localStorage key đã đặt đúng? (`ourmoney_...`)
- [ ] fallbackData lấy từ cache trước?
- [ ] onSuccess lưu cache mới?
- [ ] Mutation có update cache + SWR?
- [ ] Optimistic update nếu cần thiết?

### Pattern mutation + cache
```tsx
const handleAction = async () => {
  try {
    // 1. Call server action
    await serverAction(args);
    
    // 2. Mutate SWR (refetch from server)
    const newData = await mutate();
    
    // 3. Update localStorage cache
    if (newData && typeof window !== "undefined") {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: newData,
        cachedAt: Date.now()
      }));
    }
    
    // 4. Background refresh related caches
    mutateGlobal("/api/groups");
  } catch (error) {
    // Handle error
  }
};
```

---

## Bước 5: Testing & Verification

### Build check
```bash
npm run lint
npm run build
```

### Manual testing checklist
- [ ] Feature hoạt động trên mobile viewport
- [ ] Cache-first: data hiển thị ngay từ localStorage
- [ ] Background revalidation hoạt động
- [ ] Auth protection: redirect nếu chưa login
- [ ] Error handling: thông báo tiếng Việt rõ ràng
- [ ] Loading states: skeleton/spinner khi fetch
- [ ] Responsive: không vỡ layout trên desktop

---

## Bước 6: Cập nhật Documentation

- [ ] Cập nhật `PROGRESS.md` → đánh dấu feature đã hoàn thành
- [ ] Nếu đổi DB schema → cập nhật `database-schema.md`
- [ ] Nếu thêm file structure → cập nhật `architecture.md`
- [ ] Nếu thêm convention → cập nhật `naming-conventions.md`

---

## Template cho feature mới

### Nếu cần thêm 1 trang mới `/example`

```
Tạo files:
  src/app/example/page.tsx          (Server Component)
  src/app/example/ExampleClient.tsx (Client Component)
  
Nếu cần API:
  src/app/api/example/route.ts      (API Route)
  
Nếu cần action:
  src/lib/actions/example.ts        (Server Action)
  
Nếu cần component mới:
  src/components/ExampleWidget.tsx   (UI Component)
```

### Nếu cần thêm 1 modal trong group

```
Sửa files:
  src/app/group/[id]/GroupClient.tsx  (thêm state + render modal)
  
Tạo files:
  src/components/NewModal.tsx         (Modal component)
  
Nếu cần server action:
  Thêm vào file action tương ứng (bill.ts, group.ts, settlement.ts)
```

### Nếu cần thêm field vào existing model

```
1. Sửa src/models/ModelName.ts      (thêm field vào Schema + Interface)
2. Sửa src/lib/queries.ts           (thêm field vào select/populate)
3. Sửa src/lib/money-types.ts       (thêm field vào TypeScript types)
4. Cập nhật .agents/context/database-schema.md
5. Sửa components sử dụng data đó
```

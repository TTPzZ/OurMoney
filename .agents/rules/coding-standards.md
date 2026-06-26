# Coding Standards

## 1. TypeScript
- **Strict mode** luôn bật (`"strict": true` trong tsconfig)
- **Interfaces** cho props, database models, API responses
- **Type imports** khi chỉ import type: `import type { PublicUser } from "@/lib/current-user"`
- **Không dùng `any`** trừ khi không thể tránh (VD: Mongoose lean() result)
- Path alias: `@/*` → `./src/*`

## 2. React Components
- **Functional Components** + hooks. KHÔNG dùng Class Components
- **Server Components** mặc định. Chỉ thêm `"use client"` khi cần hooks/state/events
- **Tách logic:** UI components không chứa business logic trực tiếp
- **Props typing:** Luôn define interface cho props

### Khi nào dùng "use client"
```
✅ Cần useState, useEffect, useSWR, useRouter
✅ Cần event handlers (onClick, onChange, onSubmit)
✅ Cần browser APIs (localStorage, window, navigator)
✅ Cần animation/transition interactivity

❌ Chỉ render static content
❌ Chỉ fetch data rồi pass xuống
❌ Layout/wrapper components
```

## 3. Data Fetching

### Server-side (trong page.tsx)
```tsx
// page.tsx - Server Component
const session = await auth();
const groups = await getGroupsForUser(session.user.id);
return <ClientComponent initialGroups={groups} />;
```

### Client-side (SWR)
```tsx
// Component - Client
const { data, mutate, isValidating } = useSWR<T>(
  "/api/endpoint",
  fetcher,
  {
    fallbackData: getCachedData(),
    revalidateOnMount: true,
    onSuccess: (newData) => { /* save to localStorage */ }
  }
);
```

### Server Actions
```tsx
// actions/group.ts
"use server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";

export async function createGroup(name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await connectDB();
  // ... logic
  revalidatePath("/dashboard");
  return { success: true, groupId: "..." };
}
```

## 4. API Routes
- Luôn check auth: `const session = await auth()`
- Luôn check membership trước khi trả data nhóm
- Return `NextResponse.json()` với proper status codes
- Catch errors, return user-friendly messages (tiếng Việt)
- Set `preferredRegion = "sin1"` cho Vercel deployment

## 5. Styling (Tailwind CSS v4)
- **Utility-first**: dùng Tailwind classes trực tiếp
- **Mobile-first**: design cho mobile trước, responsive cho desktop
- **Touch targets**: buttons tối thiểu 44px tall
- **Color system**: 
  - Primary: `indigo-600` (brand color)
  - Success: `emerald-500`
  - Danger: `red-500`
  - Warning: `amber-500`
  - Text: `slate-900` (heading), `slate-500` (body), `slate-400` (muted)
  - Background: `slate-50` (page), `white` (cards)
- **Border radius**: `rounded-2xl` (cards), `rounded-3xl` (large cards), `rounded-full` (avatars)
- **Shadows**: `shadow-sm` (cards), `shadow-xl` (elevated), `shadow-2xl` (modals)
- **Typography**: 
  - Labels/meta: `text-[10px] font-bold uppercase tracking-widest text-slate-400`
  - Body: `text-sm font-medium`
  - Headings: `text-xl font-bold` hoặc `text-2xl font-black tracking-tight`

## 6. Error Handling
- Server Actions: `throw new Error("Thông báo tiếng Việt")`
- API Routes: `NextResponse.json({ error: "message" }, { status: code })`
- Client: try/catch + alert() hoặc inline error state
- Console.error cho debugging, không expose internal errors cho user

## 7. Security
- **Authentication**: Mọi API/action phải check `session.user.id`
- **Authorization**: Check membership trước khi trả data nhóm
- **Join group**: CHỈ bằng inviteCode, KHÔNG bằng groupId
- **Delete group**: CHỈ creator (trưởng nhóm)
- **Leave group**: Phải hết nợ trước
- **Headers**: X-Frame-Options DENY, X-Content-Type-Options nosniff
- **Callback URLs**: Validate starts with "/" và không phải "//"

## 8. Performance
- **Cache-first**: localStorage cache cho groups, group detail, profile
- **SWR deduping**: `dedupingInterval: 5000`
- **No preload storm**: Dashboard KHÔNG preload group details
- **Parallel queries**: `Promise.all()` cho independent DB queries
- **MongoDB indexes**: Đảm bảo compound indexes align với query patterns
- **Limit queries**: Bills giới hạn 50 per group

## 9. State Management
- **SWR** cho server state (API data)
- **useState** cho local UI state (modals, forms)
- **localStorage** cho cache persistence
- **URL state** qua `window.history.pushState` (SPA shell)
- **KHÔNG dùng** Redux, Zustand, hay global state phức tạp

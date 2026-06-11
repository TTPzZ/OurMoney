# Nhiệm vụ: Tối ưu UX điều hướng bằng cache + background revalidation cho OurMoney

## Bối cảnh dự án

Dự án: **OurMoney**
Stack hiện tại:

* Next.js App Router
* NextAuth / Google Login
* MongoDB + Mongoose
* Deploy trên Vercel

Hiện trạng:

* Sau khi tối ưu region/cold start, lần đầu mở group đã đỡ chậm hơn.
* Tuy nhiên khi người dùng chuyển giữa Dashboard và Group, UI vẫn có cảm giác chậm.
* DevTools cho thấy một số request RSC như:

```txt
/group/[id]?_rsc=...
/dashboard?_rsc=...
```

có thông số khoảng:

```txt
Waiting for server response: 300–400ms
Content Download: ~900ms
Size: khoảng 1.6KB ở các lần sau
```

Vì payload rất nhỏ nhưng vẫn cảm giác chờ, vấn đề chính không còn là payload lớn, mà là app vẫn phụ thuộc quá nhiều vào server navigation/RSC request cho mỗi lần chuyển màn hình.

---

# Mục tiêu

Triển khai cơ chế:

```txt
Cache data → hiển thị ngay → fetch lại ở background → nếu có dữ liệu mới thì tự cập nhật UI
```

Không dùng realtime/websocket ở giai đoạn này.

Mục tiêu UX:

* Sau login, dashboard load xong thì âm thầm prefetch một số group.
* Khi user click vào group, nếu có cache thì hiển thị gần như tức thì.
* Sau khi vào group, app tự fetch dữ liệu mới ở background.
* Nếu dữ liệu mới khác cache thì cập nhật UI luôn.
* Không bắt user reload trang.
* Không bắt user bấm ra ngoài rồi vào lại để thấy dữ liệu mới.
* Không rewrite toàn bộ app.

---

# Yêu cầu kỹ thuật

Ưu tiên dùng **SWR** vì nhẹ và dễ tích hợp.

Nếu project đã có TanStack Query thì dùng TanStack Query cũng được, nhưng không tự ý thêm cả hai thư viện cùng lúc.

Nếu chưa có SWR thì cài:

```bash
npm install swr
```

---

# Phạm vi cần làm

## 1. Tạo API endpoint cho Dashboard group list

Tạo hoặc kiểm tra endpoint:

```txt
GET /api/groups
```

Endpoint này trả về danh sách group của user hiện tại.

Yêu cầu:

* Verify auth bằng NextAuth.
* Nếu chưa đăng nhập thì trả 401.
* Chỉ trả group mà user là member.
* Chỉ select field cần thiết.
* Không trả dữ liệu thừa.

Dữ liệu gợi ý:

```ts
{
  groups: [
    {
      _id: string,
      name: string,
      membersCount: number,
      updatedAt?: string,
      createdAt?: string
    }
  ],
  version?: string
}
```

Không trả về:

* googleId
* email của member nếu không cần
* __v
* token/secret
* object user đầy đủ

---

## 2. Tạo API endpoint cho Group detail

Tạo hoặc kiểm tra endpoint:

```txt
GET /api/groups/[id]
```

Endpoint này trả dữ liệu cần cho trang group detail.

Yêu cầu:

* Verify auth.
* Check user hiện tại có thuộc group không.
* Nếu không có quyền thì trả 403 hoặc 404.
* Chỉ select field cần cho UI.
* Không populate User đầy đủ.
* Có `.lean()` cho query Mongoose.

Dữ liệu trả về gợi ý:

```ts
{
  group: {
    _id: string,
    name: string,
    members: [
      {
        _id: string,
        name: string,
        image?: string
      }
    ],
    createdAt?: string,
    updatedAt?: string
  },
  bills: [
    {
      _id: string,
      title: string,
      amount: number,
      paidBy: {
        _id: string,
        name: string,
        image?: string
      },
      splitBetween: ...,
      createdAt: string,
      updatedAt?: string
    }
  ],
  settlements: [
    {
      _id: string,
      from: {
        _id: string,
        name: string,
        image?: string
      },
      to: {
        _id: string,
        name: string,
        image?: string
      },
      amount: number,
      status: string,
      createdAt: string,
      updatedAt?: string
    }
  ],
  summary?: ...,
  version: string
}
```

`version` có thể là timestamp mới nhất từ group/bills/settlements, ví dụ max `updatedAt`.

Mục đích của `version`:

* Dễ biết dữ liệu đã thay đổi chưa.
* Giúp debug/cache sau này.

---

## 3. Tạo fetcher dùng chung

Tạo file, ví dụ:

```txt
src/lib/fetcher.ts
```

Nội dung:

```ts
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(message || `Failed to fetch ${url}`);
  }

  return res.json();
}
```

---

## 4. Tạo SWR Provider

Nếu app đã có file providers thì thêm vào đó.

Ví dụ:

```tsx
"use client";

import { SWRConfig } from "swr";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        revalidateIfStale: true,
        dedupingInterval: 5000,
        keepPreviousData: true,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

Nếu đã có provider khác như ThemeProvider/SessionProvider thì bọc SWRConfig vào cùng, không phá cấu trúc hiện tại.

---

## 5. Sửa Dashboard để dùng cache

Dashboard hiện tại có thể vẫn là server page.

Yêu cầu:

* Server page vẫn được phép check auth.
* Có thể fetch initial groups từ server.
* Truyền `initialGroupsData` xuống client component.
* Client component dùng SWR với `fallbackData`.

Ví dụ logic:

```tsx
const { data, isLoading, isValidating, mutate } = useSWR(
  "/api/groups",
  fetcher,
  {
    fallbackData: initialGroupsData,
    revalidateOnMount: true,
    revalidateOnFocus: true,
  }
);
```

Khi quay lại dashboard:

* Hiển thị cache ngay.
* Background fetch lại.
* Nếu có group mới/thay đổi thì UI cập nhật.

---

## 6. Prefetch group detail sau khi login/dashboard load xong

Trong Dashboard client component:

* Sau khi có danh sách groups, prefetch tối đa 3–5 group gần nhất.
* Không prefetch toàn bộ nếu user có nhiều group.
* Tránh spam request.

Ví dụ:

```tsx
import { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

const { mutate } = useSWRConfig();

useEffect(() => {
  if (!groups?.length) return;

  groups.slice(0, 5).forEach((group) => {
    const key = `/api/groups/${group._id}`;

    mutate(key, fetcher(key), {
      revalidate: false,
      populateCache: true,
    });
  });
}, [groups, mutate]);
```

Nếu thấy cách này gây request ngay quá nhiều, chuyển sang prefetch khi hover group card:

```tsx
onMouseEnter={() => {
  const key = `/api/groups/${group._id}`;

  mutate(key, fetcher(key), {
    revalidate: false,
    populateCache: true,
  });
}}
```

Có thể kết hợp:

* Auto prefetch 3 group mới nhất.
* Hover thì prefetch group đó.

---

## 7. Sửa Group Detail để dùng cache + background revalidation

Trang `/group/[id]`:

* Server page vẫn check auth.
* Có thể fetch initial group data.
* Truyền `initialData` xuống `GroupClient`.
* `GroupClient` dùng SWR.

Ví dụ:

```tsx
const { data, error, isLoading, isValidating, mutate } = useSWR(
  `/api/groups/${groupId}`,
  fetcher,
  {
    fallbackData: initialData,
    revalidateOnMount: true,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  }
);
```

Yêu cầu:

* Nếu có `fallbackData`, render ngay.
* Khi SWR fetch xong dữ liệu mới, UI tự cập nhật.
* Nếu đang background fetch thì có thể hiện text/icon nhỏ:

```txt
Đang cập nhật...
```

Không làm loading full screen nếu đã có dữ liệu cache.

---

## 8. Không bắt user reload để thấy dữ liệu mới

Nếu background fetch trả dữ liệu mới:

* Cập nhật UI luôn.
* Không yêu cầu user reload trang.
* Không yêu cầu user thoát group rồi vào lại.

Nếu cần tránh UI nhảy bất ngờ, có thể hiện toast nhỏ:

```txt
Dữ liệu đã được cập nhật
```

Nhưng không bắt buộc.

---

## 9. Sau mutation phải cập nhật cache đúng key

Kiểm tra các action:

* create group
* join group
* update group
* delete group
* create bill
* update bill
* delete bill
* create settlement
* update settlement

Sau khi mutation thành công:

* Update hoặc invalidate đúng SWR key.
* Hạn chế dùng `router.refresh()` nếu không cần.
* Không `revalidatePath()` quá rộng.

Ví dụ sau khi tạo bill:

```tsx
await createBill(payload);

mutate(`/api/groups/${groupId}`);
mutate("/api/groups");
```

Nếu dễ làm optimistic UI thì có thể làm, nhưng không bắt buộc trong phase này.

Phase này ưu tiên:

* submit thành công
* cache refresh đúng
* UI cập nhật nhanh

---

## 10. Kiểm tra và giảm refresh thừa

Search toàn bộ project:

```bash
grep -R "router.refresh" src
grep -R "revalidatePath" src
grep -R "window.location" src
grep -R "location.href" src
```

Yêu cầu:

* Không gọi `router.refresh()` trong `useEffect`.
* Không refresh ngay sau khi navigation nếu không cần.
* Không dùng `window.location.href` cho route nội bộ.
* Route nội bộ phải dùng `Link` hoặc `router.push`.

---

## 11. Loading UI

Nếu route vẫn cần server navigation:

* Thêm loading skeleton nhẹ.
* Không hiện màn hình trắng.

Có thể thêm:

```txt
src/app/dashboard/loading.tsx
src/app/group/[id]/loading.tsx
```

Nhưng lưu ý:

* Nếu đã có cache data trong client, ưu tiên render cache, không thay bằng full loading.

---

## 12. Kiểm tra bảo mật

Các API endpoint phải:

* Check user đã login.
* Check quyền truy cập group.
* Không để user A đọc group của user B bằng cách đổi URL.
* Không trả field nhạy cảm.

---

## 13. Đo hiệu năng sau khi sửa

Sau khi hoàn thành, chạy:

```bash
npm run lint
npm run build
```

Sau đó deploy và test các flow:

1. Login.
2. Vào dashboard.
3. Đợi 1–2 giây để prefetch.
4. Click vào group.
5. Back về dashboard.
6. Vào lại group.
7. Tạo bill mới.
8. Kiểm tra group cập nhật đúng.
9. Focus tab lại sau vài giây để xem SWR có refresh không.

Ghi nhận:

* UI có hiện ngay từ cache không.
* Có còn full loading không.
* Có request spam không.
* Network `_rsc` có còn làm UX bị chờ không.
* API `/api/groups/[id]` có chạy background hợp lý không.

---

# Acceptance Criteria

Hoàn thành khi:

* Login Google vẫn hoạt động.
* Dashboard hiển thị group bình thường.
* Dashboard dùng cache, quay lại không bị chờ rõ rệt.
* Group detail nếu đã có cache thì hiển thị gần như tức thì.
* Group detail tự background fetch dữ liệu mới.
* Nếu dữ liệu mới khác cache thì UI cập nhật tự động.
* Add bill xong dữ liệu group cập nhật đúng.
* Không cần realtime/websocket.
* Không cần reload trang để thấy dữ liệu mới.
* Không spam request.
* Không lộ dữ liệu user/group không thuộc quyền truy cập.
* Build production thành công.

---

# Báo cáo sau khi làm xong

Hãy báo lại:

1. Đã sửa/thêm những file nào.
2. Dùng SWR hay TanStack Query.
3. Những SWR key/API key đang dùng.
4. Cách dashboard prefetch group detail.
5. Cách group detail background refresh.
6. Cách cache được cập nhật sau khi tạo bill/group/settlement.
7. Các chỗ đã loại bỏ `router.refresh()` hoặc `revalidatePath()` thừa.
8. Kết quả test trước/sau.
9. Rủi ro còn lại nếu có.

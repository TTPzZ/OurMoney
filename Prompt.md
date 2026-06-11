# Nhiệm vụ: Sửa cache flow để click Group hiển thị dữ liệu đã preload ngay lập tức

## Bối cảnh

Project OurMoney đang dùng:

* Next.js App Router
* NextAuth
* MongoDB/Mongoose
* SWR hoặc cơ chế cache tương tự
* Deploy Vercel

Phase trước đã cố làm cache + background revalidation, nhưng UX vẫn chưa đúng mục tiêu.

Hiện tượng hiện tại:

* Sau khi login/dashboard load xong, click vào group vẫn phải chờ route `/group/[id]?_rsc=...`.
* Network vẫn cho thấy request RSC của `/group/[id]` mất khoảng 1.3s.
* Điều này chứng tỏ app vẫn đang chờ server navigation trước khi Group UI được mount.
* Cache có thể đã tồn tại, nhưng nó chỉ được dùng sau khi route group đã load xong, nên người dùng vẫn phải chờ.

## Mục tiêu thật sự

Sau khi user đăng nhập:

```txt
Dashboard load
→ app âm thầm preload dữ liệu group
→ user click group
→ hiển thị dữ liệu group từ cache ngay lập tức
→ sau đó mới background fetch dữ liệu mới nhất
→ nếu có thay đổi thì update UI
```

Không được để click group phải chờ `/group/[id]?_rsc=...` xong mới hiện UI.

## Yêu cầu quan trọng

1. Không dùng realtime/websocket.
2. Không rewrite toàn bộ app nếu không cần.
3. Ưu tiên UX instant.
4. Không làm hỏng auth, group, bill, settlement.
5. Không prefetch toàn bộ nếu user có quá nhiều group.
6. Không bắt user reload trang.
7. Không bắt user bấm ra ngoài rồi vào lại để thấy dữ liệu mới.

---

# Hướng sửa bắt buộc

## 1. Tạo Client Shell sau login

Tạo một client component kiểu:

```txt
MoneyClientShell
```

Shell này chịu trách nhiệm:

* giữ current view hiện tại
* giữ selectedGroupId
* render DashboardView hoặc GroupDetailView
* dùng SWR cache chung

Ví dụ structure:

```txt
MoneyClientShell
├── DashboardView
├── GroupDetailView
└── AddBillModal hoặc AddBillView
```

Server page như `/dashboard/page.tsx` chỉ nên:

* check auth
* fetch initial groups nếu cần
* render `MoneyClientShell` với initial data

## 2. Dashboard không được mở group bằng server navigation nếu muốn instant

Tìm các chỗ đang dùng:

```tsx
<Link href={`/group/${group._id}`}>
```

hoặc:

```tsx
router.push(`/group/${group._id}`)
```

cho hành động click group.

Với flow instant cache, đổi thành client action:

```tsx
onClick={() => openGroup(group._id)}
```

Trong `openGroup(groupId)`:

```tsx
setSelectedGroupId(groupId);
setView("group");

// Optional: chỉ đổi URL cho đẹp, không trigger Next.js navigation
window.history.pushState(null, "", `/group/${groupId}`);
```

Không dùng `router.push()` cho bước mở group cache, vì `router.push()` sẽ trigger route navigation và RSC request.

## 3. Preload data sau khi dashboard có group list

Sau khi load danh sách group, preload data cho một số group:

* 3–5 group gần nhất
* hoặc group hiện trong viewport
* hoặc group user hover

Không prefetch tất cả nếu quá nhiều.

Ví dụ với SWR:

```tsx
const { mutate } = useSWRConfig();

useEffect(() => {
  if (!groups?.length) return;

  groups.slice(0, 5).forEach((group) => {
    const key = `/api/groups/${group._id}`;

    mutate(key, fetcher(key), {
      populateCache: true,
      revalidate: false,
    });
  });
}, [groups, mutate]);
```

Có thể thêm hover prefetch:

```tsx
onMouseEnter={() => {
  const key = `/api/groups/${group._id}`;

  mutate(key, fetcher(key), {
    populateCache: true,
    revalidate: false,
  });
}}
```

## 4. GroupDetailView phải render từ SWR cache ngay

`GroupDetailView` nhận `groupId`.

Nó dùng SWR:

```tsx
const key = `/api/groups/${groupId}`;

const { data, isLoading, isValidating, mutate } = useSWR(key, fetcher, {
  revalidateOnMount: true,
  revalidateOnFocus: true,
  dedupingInterval: 5000,
  keepPreviousData: true,
});
```

Yêu cầu:

* Nếu SWR cache đã có data, render ngay.
* Không hiện full loading nếu cache đã có data.
* Nếu đang background fetch thì chỉ hiện indicator nhỏ như “Đang cập nhật...”.
* Nếu chưa có cache thì mới hiện skeleton/loading.

Pseudo:

```tsx
if (!data && isLoading) {
  return <GroupSkeleton />;
}

return (
  <>
    {isValidating && <SmallUpdatingIndicator />}
    <GroupContent data={data} />
  </>
);
```

## 5. Background fetch và auto update

Khi user mở group:

* UI render cache ngay.
* SWR tự fetch lại.
* Nếu server trả data mới, UI update tự động.
* Không yêu cầu user reload.

Có thể dùng field `version` từ API để debug data có đổi không.

## 6. API cần có

Đảm bảo có:

```txt
GET /api/groups
GET /api/groups/[id]
```

Yêu cầu:

* Verify auth.
* Check quyền truy cập group.
* Chỉ select field cần thiết.
* Không trả field nhạy cảm như googleId, email nếu không cần, __v, token.
* Dữ liệu phải đủ để render GroupDetailView.

## 7. Back về Dashboard cũng không nên dùng server navigation

Khi đang ở GroupDetailView, nút Back nên làm:

```tsx
setView("dashboard");
setSelectedGroupId(null);
window.history.pushState(null, "", "/dashboard");
```

Không dùng `router.push("/dashboard")` nếu muốn dashboard hiện cache ngay.

## 8. Xử lý browser Back/Forward

Vì dùng `window.history.pushState`, cần nghe `popstate` để đồng bộ view khi user bấm nút Back của trình duyệt.

Ví dụ:

```tsx
useEffect(() => {
  const handlePopState = () => {
    const path = window.location.pathname;

    if (path.startsWith("/group/")) {
      const groupId = path.split("/")[2];
      setSelectedGroupId(groupId);
      setView("group");
    } else {
      setSelectedGroupId(null);
      setView("dashboard");
    }
  };

  window.addEventListener("popstate", handlePopState);

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}, []);
```

## 9. Sau mutation phải cập nhật cache

Sau khi:

* create bill
* update bill
* delete bill
* join group
* create settlement
* update settlement

Cần mutate đúng SWR key:

```tsx
mutate(`/api/groups/${groupId}`);
mutate("/api/groups");
```

Nếu dễ, có thể optimistic update, nhưng không bắt buộc trong phase này.

Không dùng `router.refresh()` nếu không cần.

## 10. Giữ route `/group/[id]` cho deep link

Vẫn nên giữ `/group/[id]/page.tsx` để user mở trực tiếp link group vẫn hoạt động.

Nhưng flow click từ dashboard nên ưu tiên client shell instant view.

Nếu user reload trực tiếp `/group/[id]`:

* server page vẫn render bình thường.
* không cần instant cache vì cache chưa có.

## 11. Đo lại sau khi sửa

Test flow:

1. Login.
2. Vào dashboard.
3. Đợi 1–2 giây cho preload.
4. Click group đã preload.
5. UI phải hiện gần như ngay.
6. Network có thể gọi `/api/groups/[id]` background, nhưng UI không được đợi request này.
7. Bấm back về dashboard.
8. Dashboard phải hiện ngay từ cache.
9. Tạo bill mới.
10. Group cache cập nhật đúng.

## Acceptance Criteria

Hoàn thành khi:

* Click group từ dashboard không còn phải chờ `/group/[id]?_rsc=...` mới hiện UI.
* Group đã preload hiển thị từ cache gần như tức thì.
* Sau khi mở group, app background fetch dữ liệu mới nhất.
* Nếu có dữ liệu mới, UI tự cập nhật.
* Back về dashboard hiện ngay.
* Browser Back/Forward hoạt động đúng.
* Direct URL `/group/[id]` vẫn hoạt động.
* Login Google vẫn hoạt động.
* Add bill, settlement, group list vẫn hoạt động.
* Không spam request.
* Không lộ dữ liệu group của user khác.

## Báo cáo sau khi hoàn thành

Hãy báo lại:

1. Đã thêm Client Shell ở đâu.
2. Flow click group cũ và mới khác nhau thế nào.
3. Các route nào vẫn dùng server navigation.
4. Các route/view nào đã dùng client cache.
5. SWR keys đang dùng.
6. Cách preload group data sau dashboard.
7. Cách xử lý browser Back/Forward.
8. Kết quả đo Network trước/sau.
9. Rủi ro còn lại nếu có.

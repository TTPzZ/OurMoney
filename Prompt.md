# Nhiệm vụ: Fix UI nút xác nhận Add Bill và gom thời gian refresh/cache vào loading state

## Bối cảnh

Trong modal/form “Thêm hóa đơn” của OurMoney hiện có 2 vấn đề:

1. Quanh nút “Xác nhận” đang có một khung/viền/nền trắng nhìn lệch với background.
2. Khi bấm “Xác nhận”, app tạo bill xong có refresh/reload lại group/page. Việc này làm cache/preload bị mất hoặc chưa kịp nạp lại, khiến UX bị khựng sau khi submit.

Mục tiêu lần này là chữa cháy UX:

* Khi user bấm “Xác nhận”, nút/modal phải ở trạng thái loading cho đến khi toàn bộ việc tạo bill + refresh/reload + preload/cache lại dữ liệu hoàn tất.
* Sau khi mọi thứ xong mới đóng modal hoặc quay lại group.
* Người dùng không thấy màn hình bị nhảy/khựng giữa chừng.

Không thay đổi logic tính tiền, không thay đổi database schema, không thay đổi auth.

---

# Phần 1: Fix viền/nền trắng quanh nút xác nhận

Hiện trạng:

* Nút “Xác nhận” màu tím nhưng bên ngoài có một khung trắng.
* Nhìn giống button đang nằm trong một wrapper `bg-white` hoặc footer có nền trắng.

Yêu cầu:

* Xóa hoặc chỉnh wrapper quanh nút để không còn mảng trắng lệch nền.
* Nếu cần footer sticky thì background phải đồng bộ với modal/page.
* Nút phải nằm gọn, không có khung trắng thừa.

Tìm trong Add Bill form/modal các đoạn liên quan:

```bash
grep -R "Xác nhận" src
grep -R "Confirm" src
grep -R "submit" src/components src/app
```

Nếu thấy wrapper kiểu:

```tsx
<div className="bg-white p-4">
  <button>...</button>
</div>
```

hãy đổi thành một trong các hướng:

```tsx
<div className="bg-transparent px-0 pt-4">
  <button>...</button>
</div>
```

hoặc nếu nằm trong modal:

```tsx
<div className="sticky bottom-0 mt-4 border-t border-slate-100 bg-white/95 p-4 backdrop-blur">
  <button>...</button>
</div>
```

Nhưng phải đảm bảo background khớp với modal, không tạo mảng trắng thừa trên page.

Button style gợi ý:

```tsx
<button
  type="submit"
  disabled={isSubmitting}
  className="flex w-full items-center justify-center rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
>
  {isSubmitting ? "Đang tạo..." : "Xác nhận"}
</button>
```

---

# Phần 2: Gom toàn bộ thời gian submit + refresh/cache vào loading

Hiện trạng:

* Khi bấm xác nhận, bill được tạo.
* Sau đó app refresh/reload page hoặc route.
* Trong lúc refresh/cache lại, user thấy bị khựng hoặc cache tức thì bị mất.

Yêu cầu:

* Khi user bấm xác nhận:

  1. Set `isSubmitting = true`
  2. Gọi create bill
  3. Refresh/mutate lại dữ liệu group/dashboard
  4. Chạy lại preload/cache cần thiết nếu có
  5. Sau khi tất cả xong mới set `isSubmitting = false`
  6. Sau đó mới đóng modal hoặc hiển thị lại group

Pseudo mong muốn:

```tsx
const handleSubmit = async (formData) => {
  try {
    setIsSubmitting(true);

    await createBill(formData);

    // Nếu dùng SWR:
    await mutate(`/api/groups/${groupId}`);
    await mutate("/api/groups");

    // Nếu có hàm preload group detail thì gọi lại ở đây
    await preloadGroupData?.(groupId);

    onSuccess?.();
    onClose?.();
  } catch (error) {
    setError("Không thể tạo hóa đơn. Vui lòng thử lại.");
  } finally {
    setIsSubmitting(false);
  }
};
```

Nếu hiện tại đang dùng `router.refresh()`:

* Không đóng modal ngay trước khi refresh.
* Giữ loading overlay/nút loading trong lúc refresh.
* Ưu tiên dùng `mutate()`/cache update thay vì full page reload nếu project đã dùng SWR.
* Nếu bắt buộc phải reload route, hãy giữ loading state cho đến khi data chính đã được refetch xong.

---

# Phần 3: Không reload bằng window.location nếu không cần

Tìm các đoạn:

```bash
grep -R "window.location" src
grep -R "location.reload" src
grep -R "router.refresh" src
```

Yêu cầu:

* Không dùng `window.location.reload()` nếu có thể tránh.
* Không dùng `window.location.href` để quay về group.
* Ưu tiên:

  * update local state
  * SWR mutate
  * hoặc router.refresh chỉ như fallback

---

# Phần 4: Loading UI trong modal

Khi submit:

* Disable toàn bộ input/button để tránh bấm 2 lần.
* Nút xác nhận hiện spinner hoặc text “Đang tạo...”
* Có thể thêm overlay nhẹ trong modal.

Ví dụ spinner:

```tsx
<span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
```

Button:

```tsx
<button disabled={isSubmitting}>
  {isSubmitting && <Spinner />}
  {isSubmitting ? "Đang tạo hóa đơn..." : "Xác nhận"}
</button>
```

Không để user bấm nhiều lần tạo trùng bill.

---

# Phần 5: Sau khi submit thành công

Yêu cầu UX:

* Bill mới xuất hiện trong group sau khi modal đóng.
* Dashboard/group cache được cập nhật.
* User không thấy trắng màn hình hoặc giật route.
* Nếu cần chờ 1–2 giây để refresh/cache lại, cứ để nút/modal loading trong khoảng đó.
* Khi loading xong, modal đóng và group đã có dữ liệu mới.

Nếu dùng SWR:

```tsx
await mutate(`/api/groups/${groupId}`);
await mutate("/api/groups");
```

Nếu có cache prefetch:

```tsx
await preloadGroupData(groupId);
```

---

# Phần 6: Test checklist

Sau khi sửa, test:

1. Vào group.
2. Bấm “Thêm hóa đơn”.
3. Modal mở.
4. Nút xác nhận không còn khung trắng thừa.
5. Nhập nội dung và số tiền.
6. Bấm xác nhận.
7. Nút chuyển sang loading.
8. Không bấm được lần 2.
9. Trong lúc tạo bill và refresh/cache, modal vẫn giữ trạng thái loading.
10. Khi xong, modal đóng.
11. Group hiển thị bill mới.
12. Không bị reload trắng màn hình rõ rệt.
13. Không mất dữ liệu cache/preload một cách gây khựng.
14. Test mobile và desktop.
15. Chạy:

```bash
npm run lint
npm run build
```

---

# Acceptance Criteria

Hoàn thành khi:

* Không còn mảng/viền trắng thừa quanh nút “Xác nhận”.
* Bấm xác nhận có loading rõ ràng.
* Loading bao trùm cả thời gian tạo bill và refresh/cache lại dữ liệu.
* Không tạo bill trùng khi bấm nhiều lần.
* Modal chỉ đóng sau khi dữ liệu group đã cập nhật xong.
* Group hiển thị bill mới sau khi modal đóng.
* Không thay đổi logic chia tiền/bill.
* Build thành công.

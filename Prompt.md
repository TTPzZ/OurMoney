# Nhiệm vụ: Chuyển Add Bill page thành modal trong Group, fix UI form thêm hóa đơn

## Bối cảnh

Project: OurMoney
Stack:

* Next.js App Router
* NextAuth
* MongoDB/Mongoose
* Tailwind CSS
* Có page thêm hóa đơn hiện tại, route dạng `/group/[id]/add-bill` hoặc tương tự.

Hiện tại trang “Thêm hóa đơn” có nhiều vấn đề:

* Khi bấm thêm hóa đơn phải load sang page mới.
* Sau khi tạo hóa đơn lại phải quay về group và load lại.
* UX bị chậm và không giống app.
* UI form đang lỗi:

  * input bị nền đen/chữ tối đè lên nhau
  * placeholder khó đọc
  * font size trong input quá lớn
  * nút xác nhận bị đè lên nội dung bên dưới
  * mobile/desktop đều có nguy cơ vỡ layout

Mục tiêu lần này:

* Bỏ flow mở trang riêng để thêm hóa đơn.
* Chuyển form thêm hóa đơn thành modal/popup mở ngay trong trang group.
* Không thay đổi logic tính tiền, chia tiền, người trả tiền, người tham gia.
* Không thay đổi database schema.
* Không thay đổi auth.
* Không thêm tính năng mới ngoài việc chuyển UI từ page sang modal.
* Fix UI form cho sạch, dễ dùng, không lỗi màu/font/spacing.

---

# Mục tiêu UX mới

Flow mong muốn:

```txt
User đang ở Group Detail
→ bấm nút “Thêm hóa đơn”
→ mở modal Add Bill ngay lập tức
→ nhập nội dung/số tiền/người trả/người tham gia
→ bấm “Tạo hóa đơn” hoặc “Xác nhận”
→ submit loading trong modal
→ tạo bill thành công
→ đóng modal
→ cập nhật danh sách hóa đơn trong group
→ không chuyển page
→ không reload toàn bộ route nếu không cần
```

Nếu có lỗi:

```txt
→ modal vẫn mở
→ hiển thị lỗi trong modal
→ không mất dữ liệu form nếu có thể
```

---

# Phạm vi được phép sửa

Được sửa:

* UI Add Bill form.
* Component group detail để mở modal.
* Cách gọi create bill từ modal.
* Cache/mutate sau khi tạo bill nếu project đang dùng SWR.
* Styling input/button/card/modal.
* Có thể tách form hiện tại thành component dùng lại.

Không được sửa:

* Logic chia tiền.
* Logic tính settlement.
* MongoDB schema nếu không bắt buộc.
* Auth/session.
* Permission check.
* API/server action create bill, trừ khi cần expose lại để modal gọi được đúng cách.
* Luồng join group, profile, dashboard ngoài phạm vi.

---

# Việc cần làm

## 1. Tìm page Add Bill hiện tại

Tìm các file liên quan:

```bash
grep -R "Thêm hóa đơn" src
grep -R "add-bill" src
grep -R "createBill" src
grep -R "Tổng số tiền" src
grep -R "Người trả tiền" src
```

Các file có thể liên quan:

```txt
src/app/group/[id]/add-bill/page.tsx
src/app/dashboard/group/[id]/add-bill/page.tsx
src/components/AddBillForm.tsx
src/lib/actions/bill.ts
src/lib/actions/group.ts
```

Không xóa logic vội. Đọc trước toàn bộ flow hiện tại.

---

## 2. Tách form Add Bill thành component riêng

Nếu form hiện đang nằm trực tiếp trong page, tách thành component:

```txt
src/components/bills/AddBillForm.tsx
```

Component này nhận props:

```ts
type AddBillFormProps = {
  groupId: string;
  members: Array<{
    _id: string;
    name: string;
    image?: string | null;
  }>;
  onSuccess?: () => void;
  onCancel?: () => void;
};
```

Yêu cầu:

* Giữ nguyên logic chọn người trả tiền.
* Giữ nguyên logic chọn người cùng tham gia.
* Giữ nguyên logic chia đều/tùy chỉnh nếu đang có.
* Giữ nguyên validation hiện tại.
* Giữ nguyên server action/API đang tạo bill.

---

## 3. Tạo Add Bill Modal

Tạo component:

```txt
src/components/bills/AddBillModal.tsx
```

Props:

```ts
type AddBillModalProps = {
  open: boolean;
  onClose: () => void;
  groupId: string;
  members: Member[];
};
```

Modal yêu cầu:

* Overlay nền mờ nhẹ.
* Card modal bo góc, sạch, responsive.
* Desktop: modal nằm giữa màn hình, max width khoảng `max-w-lg` hoặc `max-w-xl`.
* Mobile: modal gần full width, có margin, không tràn ngang.
* Nội dung modal scroll được nếu dài.
* Nút submit không được đè lên danh sách người tham gia.
* Có nút đóng `X` hoặc `Hủy`.

Gợi ý layout:

```tsx
<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
  <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-xl">
    ...
  </div>
</div>
```

Nếu project có dark mode thì thêm class dark tương ứng. Nếu không có dark mode, không tự thêm dark mode mới.

---

## 4. Sửa Group Detail để mở modal

Trong trang group detail hoặc GroupClient:

* Thay Link/nút đang đi đến route add bill:

```tsx
<Link href={`/group/${groupId}/add-bill`}>
```

hoặc:

```tsx
router.push(`/group/${groupId}/add-bill`)
```

bằng state modal:

```tsx
const [showAddBill, setShowAddBill] = useState(false);

<button onClick={() => setShowAddBill(true)}>
  Thêm hóa đơn
</button>

<AddBillModal
  open={showAddBill}
  onClose={() => setShowAddBill(false)}
  groupId={groupId}
  members={group.members}
/>
```

Không dùng route navigation cho hành động thêm hóa đơn từ group nữa.

---

## 5. Sau khi tạo bill thành công

Sau submit thành công:

* Đóng modal.
* Cập nhật UI group.

Nếu project dùng SWR:

```ts
mutate(`/api/groups/${groupId}`);
mutate("/api/groups");
```

Nếu chưa dùng SWR:

* Có thể dùng callback `onSuccess`.
* Có thể tạm dùng `router.refresh()` một lần sau khi tạo bill, nhưng không lạm dụng.
* Ưu tiên update state/cache cục bộ nếu đã có data.

Yêu cầu:

* Không reload toàn bộ page bằng `window.location`.
* Không redirect sang page khác.
* Không bắt user bấm back.

---

## 6. Giữ route add-bill nếu cần fallback

Không bắt buộc xóa ngay route:

```txt
/group/[id]/add-bill
```

Có thể giữ lại để tránh broken link/direct link.

Nhưng button chính trong group không được dùng route này nữa.

Nếu muốn xử lý route cũ:

* Có thể redirect về `/group/[id]`.
* Hoặc vẫn render form cũ tạm thời.
* Không phá build.

---

# Fix UI form Add Bill

## 7. Fix input lỗi nền/chữ

Hiện tại input đang bị lỗi như ảnh:

* nền input bị đen
* chữ/placeholder bị tối
* font size quá lớn
* nhìn như bị bôi đen

Cần chuẩn hóa tất cả input trong Add Bill form.

Input title/content:

```tsx
className="w-full border-0 bg-transparent text-base font-medium text-slate-900 placeholder:text-slate-400 outline-none sm:text-lg"
```

Input amount:

```tsx
className="w-full border-0 bg-transparent text-2xl font-bold text-slate-900 placeholder:text-slate-400 outline-none sm:text-3xl"
```

Nếu đang dùng input có background riêng thì dùng:

```tsx
className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
```

Tuyệt đối tránh:

```txt
bg-black
text-slate-800 trên nền đen
text-white trên nền trắng
placeholder màu quá tối
font-size quá lớn không kiểm soát
```

---

## 8. Fix button xác nhận bị đè nội dung

Không dùng `position: fixed` hoặc `absolute` sai cách làm nút đè lên list.

Nếu muốn nút luôn dễ bấm trong modal:

* Dùng footer sticky bên trong modal.

Ví dụ:

```tsx
<div className="sticky bottom-0 -mx-5 mt-4 border-t border-slate-100 bg-white p-5">
  <button className="w-full rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white">
    Xác nhận
  </button>
</div>
```

Nhưng phải đảm bảo:

* Nội dung list không bị che.
* Có padding bottom hợp lý.
* Mobile không vỡ.

---

## 9. Chuẩn hóa section style

Các section như:

* Thông tin hóa đơn
* Người trả tiền
* Cùng tham gia

nên có spacing rõ:

```tsx
<section className="space-y-3">
  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
    ...
  </h3>
  ...
</section>
```

Card form:

```tsx
<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
  ...
</div>
```

---

## 10. Người trả tiền / người tham gia

Giữ nguyên logic hiện tại.

Chỉ chỉnh UI:

* Button chọn người trả tiền rõ active/inactive.
* Avatar size đều.
* Tên không bị vỡ.
* Mobile scroll ngang nếu nhiều member.

Gợi ý active:

```tsx
className="rounded-2xl bg-violet-600 text-white shadow-sm"
```

Inactive:

```tsx
className="rounded-2xl border border-slate-200 bg-white text-slate-700"
```

---

## 11. Không thêm AI scan feature mới

Trong ảnh có nút:

```txt
Quét hóa đơn AI
```

Nếu feature này đã tồn tại thì giữ nguyên UI, chỉ polish style.

Không được implement thêm logic AI mới trong task này.

---

# Test checklist

Sau khi sửa, chạy:

```bash
npm run lint
npm run build
```

Test thủ công:

1. Login.
2. Vào dashboard.
3. Vào một group.
4. Bấm “Thêm hóa đơn”.
5. Modal hiện ngay, không chuyển page.
6. Input nội dung đọc được, không bị nền đen.
7. Input số tiền đọc được, không bị nền đen.
8. Chọn người trả tiền hoạt động.
9. Chọn người tham gia hoạt động.
10. Chia đều/tùy chỉnh nếu có vẫn hoạt động.
11. Nút xác nhận không đè lên danh sách.
12. Submit tạo hóa đơn thành công.
13. Modal đóng.
14. Group cập nhật hóa đơn mới.
15. Không cần back page.
16. Không có request route `/add-bill` khi bấm nút thêm hóa đơn từ group.
17. Test mobile width 375px/390px.
18. Test desktop.
19. Không thay đổi logic tính toán.

---

# Acceptance Criteria

Hoàn thành khi:

* Add bill mở bằng modal trong group.
* Không còn phải load sang page add-bill khi bấm thêm hóa đơn.
* Form thêm hóa đơn không còn lỗi input nền/chữ.
* Nút xác nhận không đè lên nội dung.
* Tạo hóa đơn vẫn hoạt động đúng.
* Group cập nhật sau khi tạo hóa đơn.
* Không thay đổi business logic.
* Không thêm tính năng mới.
* Build production thành công.

---

# Báo cáo sau khi hoàn thành

Hãy báo lại:

1. Đã sửa/thêm file nào.
2. Form Add Bill được tách thành component nào.
3. Modal nằm ở component nào.
4. Button thêm hóa đơn trong group đã đổi từ route navigation sang modal state ra sao.
5. Sau khi tạo bill thì cập nhật group bằng cách nào.
6. Đã fix input lỗi nền/chữ ở đâu.
7. Có giữ route `/add-bill` cũ không.
8. Kết quả `npm run lint` và `npm run build`.

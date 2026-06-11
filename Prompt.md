Bạn hãy kiểm tra và tối ưu hiệu năng cho project Next.js OurMoney trong repo hiện tại.

Mục tiêu chính:

* Giảm thời gian chuyển trang/tab/nút từ khoảng 2–3 giây xuống nhanh nhất có thể.
* Không rewrite toàn bộ app.
* Không làm hỏng flow đăng nhập Google/NextAuth.
* Không thay đổi UI lớn nếu không cần thiết.
* Sửa theo từng bước nhỏ, dễ review.

Bối cảnh kỹ thuật:
Project đang dùng Next.js, NextAuth, Mongoose/MongoDB. Hiện tại app có dấu hiệu bị chậm vì mỗi lần chuyển trang hoặc đổi tab đang gọi `auth()`, `connectDB()` và query MongoDB lặp lại nhiều lần.

Các việc cần kiểm tra và sửa theo thứ tự ưu tiên:

1. Tối ưu `src/auth.ts`

* Kiểm tra callback `session()`.
* Nếu `session()` đang gọi `connectDB()` hoặc `User.findOne()` mỗi lần lấy session thì hãy sửa lại.
* Chỉ query/create/update user trong callback `jwt()` khi login hoặc khi thật sự cần.
* Lưu `dbUser._id` vào token, ví dụ `token.userId`.
* Trong `session()` chỉ gán:
  `session.user.id = token.userId`
* Tuyệt đối tránh query MongoDB trong `session()` cho mỗi request.

2. Giảm gọi `auth()` lặp lại

* Kiểm tra các page như:

  * `src/app/dashboard/page.tsx`
  * `src/app/group/[id]/page.tsx`
  * `src/app/dashboard/group/[id]/page.tsx`
  * các file trong `src/lib/actions/`
* Nếu page đã gọi `auth()` rồi nhưng function bên dưới lại gọi `auth()` tiếp chỉ để lấy userId thì hãy tách function query riêng.
* Tạo các query/helper kiểu:

  * `getGroupsForUser(userId)`
  * `getGroupByIdForUser(groupId, userId)`
  * `getBillsByGroupId(groupId)`
  * `getSettlementsByGroupId(groupId)`
* Các query helper này nhận `userId`/`groupId` từ page, không tự gọi `auth()`.
* Nhưng các server action dùng để mutate dữ liệu như create/update/delete/join group vẫn phải tự gọi `auth()` để đảm bảo bảo mật.

3. Tối ưu page group detail

* Nếu đang gọi các hàm lấy group, bills, settlements theo kiểu tuần tự thì đổi sang `Promise.all()` với những query độc lập.
* Đảm bảo chỉ `connectDB()` một lần trong page hoặc helper chính.
* Ví dụ logic mong muốn:

  * gọi `auth()` một lần
  * `connectDB()` một lần
  * query group để check user có quyền truy cập
  * sau đó query bills và settlements bằng `Promise.all()`

4. Kiểm tra tab trong group/dashboard

* Nếu tab Bills/Settle Up/Overview đang đổi bằng URL search param như `?tab=bills` hoặc route navigation thì đổi sang client component dùng `useState`.
* Dữ liệu nên fetch một lần từ server page rồi truyền xuống client component.
* Khi đổi tab chỉ đổi UI ở client, không được refetch/re-render server page nếu không cần.

5. Thêm index cho MongoDB models
   Kiểm tra các model như `Group`, `Bill`, `Settlement`, `User`.
   Nếu chưa có index phù hợp thì thêm:

Trong Group:

```ts
GroupSchema.index({ members: 1, createdAt: -1 });
GroupSchema.index({ inviteCode: 1 }, { unique: true });
```

Trong Bill:

```ts
BillSchema.index({ groupId: 1, createdAt: -1 });
BillSchema.index({ paidBy: 1 });
```

Trong Settlement:

```ts
SettlementSchema.index({ groupId: 1, status: 1 });
SettlementSchema.index({ groupId: 1, from: 1, to: 1 });
```

6. Kiểm tra `revalidatePath`

* Tìm các chỗ đang gọi `revalidatePath()`.
* Tránh revalidate quá rộng như toàn dashboard/layout nếu không cần.
* Sau khi create/update/delete bill/group/settlement, chỉ revalidate đúng route cần thiết.
* Không được gọi revalidate dư làm cho khi user quay lại trang cũ bị fetch lại toàn bộ.

7. Kiểm tra navigation

* Tìm các chỗ dùng:

  * `window.location.href`
  * `location.assign`
  * `<a href="/...">` cho route nội bộ
* Nếu có thì đổi sang:

  * `Link` của Next.js
  * hoặc `router.push()`
* Với route nội bộ, không được làm full page reload.

8. Kiểm tra duplicate route

* Repo đang có vẻ có cả `/group/[id]` và `/dashboard/group/[id]`.
* Kiểm tra xem có bị trùng logic không.
* Nếu có thể, chuẩn hóa về một route chính để tránh rối cache/navigation.
* Không xóa route nếu chưa chắc, nhưng hãy báo rõ route nào đang được dùng chính.

9. Sau khi sửa

* Chạy:

```bash
npm run lint
npm run build
```

* Nếu có lỗi TypeScript hoặc lint thì sửa.
* Không bỏ qua lỗi bằng `any` trừ khi thật sự cần.
* Không sửa lan man ngoài phạm vi performance.

10. Kết quả cần trả về
    Sau khi hoàn thành, hãy báo lại:

* Đã sửa những file nào.
* Nguyên nhân chậm chính là gì.
* Đã giảm được bao nhiêu lần gọi `auth()`/MongoDB ở các page chính.
* Có thay đổi nào cần migrate/index trên MongoDB Atlas không.
* Có rủi ro nào cần test lại không.

Acceptance criteria:

* Đăng nhập Google vẫn hoạt động.
* Dashboard load được group.
* Vào group detail vẫn thấy bills/settlements đúng.
* Đổi tab trong group gần như instant, không chờ 2–3 giây.
* Bấm back quay lại trang trước không bị loading lâu bất thường.
* Build production thành công.

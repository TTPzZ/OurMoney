# Nhiệm vụ: Tối ưu hiệu năng route Group trong dự án OurMoney

## Bối cảnh

Project là ứng dụng Next.js App Router chạy trên Vercel, sử dụng NextAuth và MongoDB (Mongoose).

Hiện tượng:

* Người dùng ở Việt Nam.
* Khi click vào `/group/[id]`, lần đầu mất khoảng 2–3 giây.
* Những lần sau giảm xuống khoảng 1–1.5 giây.
* Sau nhiều lần truy cập, request RSC chỉ còn khoảng 1–2KB và gần như tức thì.

Kết quả debug đã có:

### Network

Request:

```txt
/group/[id]?_rsc=...
```

Thông số:

```txt
Waiting for server response ≈ 400ms
Content Download ≈ 3s (lần đầu)
```

Payload lần đầu:

```txt
~124KB
```

Sau đó:

```txt
~1.5KB
```

### Vercel Function Logs

Middleware:

```txt
Execution Duration ≈ 11ms
```

Route:

```txt
/group/[id]
Execution Duration ≈ 966ms
```

Region:

```txt
Received in Hong Kong (hkg1)
Routed to Washington, D.C., USA (iad1)
```

Không có external API calls.

---

# Mục tiêu

Giảm thời gian mở Group xuống mức tốt nhất có thể.

Mục tiêu mong muốn:

```txt
Lần đầu < 1 giây
Lần sau < 500ms
```

Không thay đổi lớn về UI/UX.

---

# Các việc cần thực hiện

## 1. Chuyển Function Region gần Việt Nam

Kiểm tra App Router route:

```txt
/group/[id]
/dashboard
/group/[id]/add-bill
/profile
```

Thêm region preference phù hợp:

Ví dụ:

```ts
export const preferredRegion = "sin1";
```

hoặc region phù hợp với vị trí MongoDB Atlas.

Mục tiêu:

* Tránh chạy function ở Washington D.C.
* Giảm RTT cho người dùng Việt Nam.

---

## 2. Log chi tiết thời gian trong Group Page

Trong:

```txt
src/app/group/[id]/page.tsx
```

thêm log:

```ts
console.time("[group] total");

console.time("[group] auth");
...
console.timeEnd("[group] auth");

console.time("[group] fetch");
...
console.timeEnd("[group] fetch");

console.time("[group] render");
...
console.timeEnd("[group] render");

console.timeEnd("[group] total");
```

Deploy và kiểm tra Vercel Runtime Logs.

Mục tiêu:
Xác định chính xác bước nào chiếm nhiều thời gian nhất.

---

## 3. Kiểm tra connectDB()

Đảm bảo MongoDB connection được cache đúng.

Yêu cầu:

* Không reconnect mỗi request.
* Chỉ tạo connection một lần.
* Tái sử dụng connection cho các request sau.

Nếu chưa có global cache thì sửa.

---

## 4. Tối ưu query MongoDB

Kiểm tra:

```txt
Group
Bill
Settlement
User
```

Thực hiện:

### Group

Chỉ select field cần thiết.

### Bill

Chỉ select field cần dùng trong UI.

Nếu chưa có pagination:

```ts
.limit(50)
```

hoặc giá trị phù hợp.

### Settlement

Chỉ lấy dữ liệu cần thiết.

### Populate

Không populate toàn bộ User.

Ví dụ:

```ts
.populate("paidBy", "name image")
```

Không lấy:

```txt
email
googleId
__v
updatedAt
...
```

---

## 5. Kiểm tra auth()

Tìm tất cả:

```txt
auth()
```

Mục tiêu:

* Không gọi auth lặp lại nhiều lần trong cùng một request.
* Nếu page đã có session thì truyền userId xuống helper/query.

Server Actions vẫn phải verify auth riêng.

---

## 6. Kiểm tra router.refresh()

Search toàn bộ project:

```txt
router.refresh(
router.prefetch(
revalidatePath(
```

Kiểm tra xem có chỗ nào gây refresh thừa không.

Đặc biệt:

* useEffect tự refresh.
* refresh sau navigation không cần thiết.

---

## 7. Kiểm tra duplicate routes

Hiện tại có khả năng tồn tại:

```txt
/ group/[id]
/ dashboard/group/[id]
```

Đánh giá:

* Có thực sự cần cả hai không?
* Có gây request thừa không?

Nếu có thể, chuẩn hóa.

---

## 8. Đo lại hiệu năng

Sau khi sửa:

Kiểm tra lại bằng DevTools:

Route:

```txt
/group/[id]?_rsc=...
```

Ghi nhận:

```txt
TTFB
Content Download
Payload Size
```

Kiểm tra Vercel:

```txt
Middleware Duration
Function Duration
Region
```

---

# Báo cáo cuối cùng cần trả về

1. Những file đã thay đổi.
2. Region cuối cùng được sử dụng.
3. Kết quả log thời gian từng bước.
4. Những nguyên nhân gây chậm được tìm thấy.
5. Hiệu năng trước và sau khi sửa.
6. Có cần migrate/index MongoDB hay không.
7. Các rủi ro cần test lại.

---

# Điều kiện hoàn thành

* Đăng nhập Google hoạt động bình thường.
* Dashboard hoạt động bình thường.
* Group hiển thị đúng dữ liệu.
* Add Bill vẫn hoạt động.
* Không xuất hiện lỗi runtime.
* Lần đầu mở Group nhanh hơn đáng kể.
* Các lần truy cập tiếp theo gần như tức thì.

# Nhiệm vụ: Nâng cấp giao diện OurMoney, chỉ chỉnh UI/UX, không thay đổi logic

## Bối cảnh

Project: **OurMoney**
Stack hiện tại:

* Next.js App Router
* NextAuth / Google Login
* MongoDB / Mongoose
* Tailwind CSS
* Deploy trên Vercel

Mục tiêu lần này là **chỉ nâng cấp giao diện** để web nhìn sạch sẽ, hiện đại, thân thiện và nhất quán hơn.

Tuyệt đối không thêm tính năng mới, không sửa flow, không thay đổi business logic, không thay đổi API, không thay đổi database schema, không chỉnh auth, không chỉnh cache, không chỉnh route.

---

# Mục tiêu chính

Cải thiện UI hiện tại theo hướng:

* Sạch sẽ hơn.
* Dễ nhìn hơn.
* Thân thiện với người dùng hơn.
* Đồng bộ màu sắc, font, khoảng cách, bo góc, shadow.
* Không bị lỗi font.
* Không bị lỗi bóng đổ quá đậm/quá lệch.
* Không bị lỗi input chữ trùng màu nền.
* Responsive tốt trên mobile và desktop.
* Bám sát giao diện và cấu trúc hiện tại của dự án.

Không được biến web thành một thiết kế hoàn toàn khác.

---

# Phạm vi được phép chỉnh

Chỉ được chỉnh:

1. Tailwind className.
2. Layout spacing.
3. Typography.
4. Button style.
5. Card style.
6. Input/select/textarea style.
7. Modal/dialog visual style.
8. Avatar/image display style.
9. Header/navbar visual style.
10. Loading/skeleton visual style nếu đã có sẵn.
11. Empty state visual style nếu đã có sẵn.
12. Responsive class cho mobile/tablet/desktop.
13. Các component UI thuần giao diện.

Có thể tạo component UI dùng chung nếu chỉ để giảm lặp giao diện, ví dụ:

```txt
Button
Input
Card
Avatar
PageHeader
SectionCard
```

Nhưng không được thay đổi behavior.

---

# Những thứ tuyệt đối không được sửa

Không được chỉnh:

1. Auth flow.
2. Login/logout logic.
3. Server actions.
4. API route logic.
5. MongoDB query logic.
6. Database schema/model.
7. SWR/cache logic.
8. Route/navigation flow.
9. Permission/security check.
10. Bill calculation logic.
11. Settlement calculation logic.
12. Group join/share logic.
13. Upload avatar logic.
14. Any business logic.
15. Any new feature.

Không được thêm:

* Realtime.
* Chart mới.
* Animation phức tạp.
* Modal mới không có trong yêu cầu.
* Page mới.
* Button/action mới.
* Flow mới.

---

# Yêu cầu cách làm

## 1. Đọc dự án trước khi sửa

Trước khi chỉnh UI, hãy đọc cấu trúc hiện tại:

```txt
src/app
src/components
src/lib
src/styles hoặc globals.css
tailwind.config
```

Xác định:

* Các page chính.
* Các component đang dùng lại.
* Theme/màu hiện tại.
* Class Tailwind hiện tại.
* Nơi đang bị lỗi input/font/shadow.

Không sửa vội theo cảm tính.

---

## 2. Bám sát style hiện tại

Không đổi brand quá mạnh.

Nếu web đang dùng tone xanh/tím/trắng thì giữ tone đó, chỉ tinh chỉnh cho đẹp hơn.

Ưu tiên style:

```txt
clean
modern
soft
rounded
minimal
friendly
mobile-first
```

Không dùng style quá màu mè hoặc quá corporate.

---

## 3. Chuẩn hóa spacing

Kiểm tra và chỉnh lại:

* Padding page.
* Gap giữa các section.
* Khoảng cách trong card.
* Khoảng cách giữa title/subtitle/content.
* Khoảng cách button group.
* Mobile spacing.

Gợi ý:

* Page container: `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8`
* Section spacing: `space-y-6`
* Card padding: `p-4 sm:p-6`
* Button gap: `gap-2` hoặc `gap-3`

Không để UI quá sát mép màn hình mobile.

---

## 4. Chuẩn hóa card

Các card nên có style nhất quán:

```tsx
rounded-2xl border border-slate-200 bg-white shadow-sm
```

Dark mode nếu có:

```tsx
dark:border-slate-800 dark:bg-slate-950
```

Không dùng shadow quá đậm kiểu:

```tsx
shadow-2xl
shadow-black/50
```

trừ khi thực sự cần.

Ưu tiên:

```tsx
shadow-sm
shadow-md
```

---

## 5. Chuẩn hóa button

Các button phải rõ trạng thái:

* Primary
* Secondary
* Danger
* Ghost/Icon button

Yêu cầu:

* Click target đủ lớn trên mobile.
* Hover/focus rõ.
* Disabled nhìn khác active.
* Không bị chữ trùng màu nền.

Ví dụ style:

```tsx
inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition
focus:outline-none focus:ring-2 focus:ring-offset-2
disabled:pointer-events-none disabled:opacity-50
```

Không thay đổi onClick, submit handler, href, type.

---

## 6. Chuẩn hóa input/select/textarea

Đây là phần quan trọng vì hiện tại có lỗi chữ và nền trùng màu.

Tất cả input/select/textarea phải đọc được ở desktop và mobile.

Style gợi ý:

```tsx
w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400
outline-none transition
focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500
dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500
```

Kiểm tra toàn bộ:

```bash
grep -R "<input" src
grep -R "<textarea" src
grep -R "<select" src
```

Không để:

* chữ trắng trên nền trắng
* chữ đen trên nền đen
* placeholder quá mờ
* input quá nhỏ trên mobile

---

## 7. Chuẩn hóa typography

Kiểm tra title/subtitle/body text.

Gợi ý:

* Page title:

```tsx
text-2xl sm:text-3xl font-bold tracking-tight text-slate-950
```

* Section title:

```tsx
text-lg font-semibold text-slate-900
```

* Description:

```tsx
text-sm text-slate-500
```

Không dùng quá nhiều font-size khác nhau làm UI rối.

Không đổi font global nếu không cần.

---

## 8. Responsive mobile

Kiểm tra kỹ ở mobile width:

```txt
375px
390px
430px
```

Các lỗi cần tránh:

* Button tràn ngang.
* Card sát mép màn hình.
* Text quá dài không xuống dòng.
* Modal quá rộng.
* Header bị vỡ.
* Avatar stack lệch.
* Form input quá nhỏ.
* Table/list bị overflow khó chịu.

Có thể dùng:

```tsx
flex-col sm:flex-row
grid grid-cols-1 sm:grid-cols-2
text-sm sm:text-base
px-4 sm:px-6
```

Không được thay đổi flow chỉ để mobile đẹp.

---

## 9. Kiểm tra các màn chính

Cần polish các màn hiện có:

1. Landing/home page.
2. Login area nếu có.
3. Dashboard.
4. Group list/card.
5. Group detail.
6. Add bill form.
7. Profile page.
8. Invite/share group UI.
9. Member/avatar area.
10. Settlement/payment UI nếu có.
11. Empty states nếu có.
12. Loading states nếu có.

Không thêm màn mới.

---

## 10. Không làm hỏng state hoặc props

Khi refactor component UI:

* Giữ nguyên props.
* Giữ nguyên event handlers.
* Giữ nguyên form name/id nếu đang dùng.
* Giữ nguyên submit behavior.
* Giữ nguyên href.
* Giữ nguyên route.
* Giữ nguyên API call.

Chỉ được bọc thêm layout hoặc đổi className.

Ví dụ được phép:

```tsx
<button onClick={handleSave} className="...">
```

Không được đổi thành logic khác.

---

## 11. Không xóa code logic

Không xóa các đoạn:

* auth check
* validation
* mutation
* error handling
* redirect
* permission check

Nếu thấy code xấu nhưng thuộc logic, chỉ ghi chú lại, không sửa trong phase này.

---

## 12. Kiểm tra màu và dark mode

Nếu project có dark mode:

* Đảm bảo mọi text/bg/border có cặp dark tương ứng.
* Input phải đọc được.
* Card phải phân biệt nền.
* Button primary vẫn nổi bật.

Nếu project không có dark mode:

* Không tự thêm dark mode mới.
* Chỉ đảm bảo giao diện light mode ổn định.

---

## 13. Hạn chế animation

Được phép dùng transition nhẹ:

```tsx
transition
hover:shadow-md
active:scale-[0.99]
```

Không thêm animation phức tạp, không thêm thư viện animation mới.

---

## 14. Không thêm dependency UI mới nếu không cần

Không tự ý thêm:

* shadcn/ui
* framer-motion
* radix mới
* material UI
* bootstrap
* daisyUI

Nếu project đã dùng sẵn thư viện nào thì có thể tận dụng, nhưng không đổi hệ UI.

---

# Quy trình làm

1. Đọc cấu trúc project.
2. Liệt kê các page/component UI chính.
3. Xác định các style đang không đồng bộ.
4. Ưu tiên tạo/chỉnh UI component dùng chung nếu project đã có pattern phù hợp.
5. Chỉnh từng màn, mỗi lần chỉ sửa class/layout.
6. Không chạm logic.
7. Chạy kiểm tra.

---

# Test sau khi sửa

Chạy:

```bash
npm run lint
npm run build
```

Test thủ công:

1. Mở home page.
2. Login.
3. Dashboard hiển thị đúng.
4. Vào group.
5. Mở add bill.
6. Vào profile.
7. Test các input trên desktop.
8. Test các input trên mobile.
9. Kiểm tra avatar/header/card/button.
10. Kiểm tra không có lỗi text trùng màu nền.
11. Kiểm tra không có layout vỡ ngang mobile.
12. Kiểm tra các button vẫn hoạt động như trước.
13. Kiểm tra form submit vẫn hoạt động như trước.

---

# Acceptance Criteria

Hoàn thành khi:

* Giao diện nhìn sạch và nhất quán hơn.
* Không có lỗi font rõ ràng.
* Không có shadow/border quá lỗi.
* Input/select/textarea đọc được trên mọi màn.
* Mobile không vỡ layout.
* Desktop không bị trống hoặc lệch khó chịu.
* Không thêm tính năng mới.
* Không thay đổi flow.
* Không thay đổi logic.
* Không thay đổi API/database/auth.
* Build production thành công.

---

# Báo cáo sau khi làm xong

Hãy báo lại:

1. Đã chỉnh những page/component nào.
2. Những thay đổi UI chính là gì.
3. Có tạo component UI dùng chung nào không.
4. Đã sửa lỗi input contrast ở đâu.
5. Đã kiểm tra mobile/desktop chưa.
6. Có file logic nào bị đụng không. Nếu có, giải thích lý do.
7. Kết quả `npm run lint` và `npm run build`.

---


# Nhiệm vụ: Fix profile persistence, avatar/name sync, input contrast, và remove join-code UI

## Bối cảnh

Project: OurMoney
Stack:

* Next.js App Router
* NextAuth / Google Login
* MongoDB + Mongoose
* SWR/client cache đã hoặc đang được dùng cho dashboard/group

Hiện tại app có một số lỗi sau:

## Bug 1: Đổi avatar/name không đồng bộ toàn app

Hiện tượng:

* Khi đổi avatar trong profile, avatar có cập nhật ngay ở một số chỗ.
* Nhưng khi ra ngoài dashboard/trang chủ/global header thì avatar tổng không đổi.
* Vào trong group thì avatar/name lại có cập nhật.
* Tên ở profile và trang chủ vẫn hiển thị tên mặc định, không theo tên user đã chỉnh.

Yêu cầu:

* Sau khi user cập nhật name/avatar, toàn bộ UI phải đồng bộ:

  * Profile page
  * Header/navbar/global user avatar
  * Dashboard/home
  * Group member list
  * Bill paidBy avatar/name
  * Settlement from/to avatar/name nếu có hiển thị
* Không để mỗi màn hình dùng một nguồn dữ liệu khác nhau gây lệch.

Hướng xử lý đề xuất:

1. Tạo hoặc kiểm tra endpoint current user:

   * `GET /api/me`
   * `PATCH /api/me`

2. `GET /api/me` trả về user hiện tại từ database:

```ts
{
  user: {
    _id: string,
    name: string,
    image?: string,
    email?: string
  }
}
```

3. `PATCH /api/me` nhận:

```ts
{
  name?: string,
  image?: string
}
```

4. Khi update profile:

   * Lưu vào MongoDB User collection.
   * Return user mới nhất.
   * Update cache ngay:

```ts
mutate("/api/me");
mutate("/api/groups");
mutate((key) => typeof key === "string" && key.startsWith("/api/groups/"));
```

5. Nếu dùng NextAuth session ở UI:

   * Sau khi update profile, gọi `session.update()` nếu project có `useSession()`.
   * Hoặc chuyển header/profile/global user UI sang đọc từ `/api/me` bằng SWR thay vì chỉ đọc `session.user`.

Mục tiêu:

* Không cần logout/login lại để thấy tên/avatar mới.
* UI cập nhật ngay sau khi bấm Save.

---

## Bug 2: Đăng nhập lại thì tên/avatar đã chỉnh bị mất

Hiện tượng:

* User đổi tên/avatar.
* Sau khi đăng xuất/đăng nhập lại, tên/avatar quay về mặc định của Google hoặc biến mất.

Nguyên nhân nghi ngờ:

* NextAuth callback đang overwrite database user bằng thông tin Google mỗi lần login.
* Hoặc profile update chỉ nằm ở client state/cache/session, chưa lưu bền vào MongoDB.
* Hoặc session/JWT không lấy dữ liệu custom từ database.

Yêu cầu:

* Tên/avatar user chỉnh phải persist trong MongoDB.
* Đăng nhập lại vẫn giữ tên/avatar đã chỉnh.
* Google profile chỉ dùng làm default lần đầu tạo user, không overwrite custom profile mỗi lần login.

Hướng sửa auth:

1. Kiểm tra `src/auth.ts`.
2. Trong callback `jwt()` hoặc logic đăng nhập Google:

   * Nếu user chưa tồn tại thì tạo user mới với name/image từ Google.
   * Nếu user đã tồn tại thì KHÔNG overwrite custom `name` và `image` bằng Google profile.
   * Chỉ update các field an toàn như email/googleId nếu cần.

Ví dụ logic mong muốn:

```ts
let dbUser = await User.findOne({ googleId: profile.sub });

if (!dbUser) {
  dbUser = await User.create({
    googleId: profile.sub,
    email: user.email,
    name: user.name,
    image: user.image,
  });
} else {
  // Không overwrite custom name/image ở đây
  // Chỉ đảm bảo email/googleId tồn tại nếu cần
  dbUser.email = dbUser.email || user.email;
  dbUser.googleId = dbUser.googleId || profile.sub;
  await dbUser.save();
}

token.userId = dbUser._id.toString();
token.name = dbUser.name;
token.picture = dbUser.image;
```

3. Nếu user update profile, đảm bảo database field được update:

```ts
User.findByIdAndUpdate(userId, {
  name,
  image,
}, { new: true })
```

4. Nếu muốn phân biệt Google avatar và custom avatar, có thể thêm field:

```ts
name
image
googleImage
```

Nhưng không bắt buộc nếu sửa overwrite đúng.

Acceptance:

* Đổi tên/avatar → reload trang vẫn còn.
* Logout/login lại → vẫn còn.
* Không bị Google profile ghi đè.

---

## Bug 3: Header/navbar/avatar tổng không đổi

Hiện tượng:

* Avatar ở profile có đổi.
* Nhưng avatar tổng/global avatar/navbar/home không đổi.

Yêu cầu:

* Tất cả component hiển thị current user phải dùng cùng một source.

Hướng xử lý:

1. Tạo hook:

```ts
useCurrentUser()
```

Hook này dùng SWR:

```ts
useSWR("/api/me", fetcher)
```

2. Header/Navbar/Profile/Home dùng `useCurrentUser()` thay vì mỗi nơi tự lấy session hoặc props cũ.

3. Sau khi update profile:

```ts
mutate("/api/me", newUserData, { revalidate: false });
mutate("/api/me");
```

4. Nếu session vẫn cần dùng:

   * Dùng session chỉ để biết đã login hay chưa.
   * Dữ liệu hiển thị name/avatar ưu tiên từ `/api/me`.

---

## Bug 4: Một số input bị chữ và màu nền trùng nhau

Hiện tượng:

* Ở một số ô nhập, text và background bị trùng màu.
* Lỗi xuất hiện lúc trên mobile, lúc trên desktop.
* Có thể liên quan dark mode/light mode hoặc Tailwind class thiếu `text-*` / `bg-*`.

Yêu cầu:

* Toàn bộ input/select/textarea phải đọc được rõ ở cả desktop/mobile.
* Không để chữ trắng trên nền trắng hoặc chữ đen trên nền đen.
* Placeholder cũng phải rõ.

Việc cần làm:

1. Search toàn bộ project:

```bash
grep -R "<input" src
grep -R "<textarea" src
grep -R "<select" src
```

2. Chuẩn hóa class cho input:

```tsx
className="w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
```

3. Nếu có component Input chung thì sửa ở component chung.
4. Nếu chưa có component Input chung, cân nhắc tạo component dùng lại:

```txt
src/components/ui/Input.tsx
```

5. Kiểm tra các màn:

* Login/home nếu có input
* Profile edit name/avatar
* Create group
* Join group nếu còn
* Add bill
* Settlement/payment form
* Mobile responsive

Acceptance:

* Input nhìn rõ trên desktop.
* Input nhìn rõ trên mobile.
* Dark/light mode không bị mất chữ.
* Placeholder không bị trùng nền.

---

## Bug 5: Bỏ mã tham gia và ô nhập mã tham gia, chỉ giữ QR và link

Hiện tại có UI hiển thị:

* Mã tham gia group
* Ô nhập mã tham gia

Yêu cầu mới:

* Xóa phần hiển thị mã tham gia dạng text.
* Xóa ô nhập mã tham gia.
* Chỉ giữ:

  * QR code
  * Invite link / copy link

Lưu ý:

* Không nhất thiết xóa field `inviteCode` trong database nếu link/QR vẫn cần dùng nó.
* Chỉ xóa khỏi UI những phần:

  * text code thủ công
  * input nhập code thủ công
  * button join bằng code nếu không còn cần

Yêu cầu flow mới:

* Người tạo group chia sẻ link hoặc QR.
* Người khác bấm link hoặc quét QR để join group.
* Không cần nhập code thủ công.

Việc cần kiểm tra:

1. Tìm các component liên quan:

```bash
grep -R "inviteCode" src
grep -R "join code" src
grep -R "Join Code" src
grep -R "code" src/app src/components
```

2. Remove UI:

* Code display
* Code input
* Join by code form

3. Giữ UI:

* QR code
* Copy invite link button

4. Đảm bảo invite link vẫn hoạt động:

```txt
/group/join?token=...
```

hoặc route hiện tại của project.

5. Nếu backend hiện chỉ join bằng code, không xóa backend vội.

   * Có thể giữ API cũ để tránh phá logic.
   * Nhưng UI không dùng nó nữa.

Acceptance:

* Không còn thấy mã tham gia dạng text.
* Không còn ô nhập mã tham gia.
* QR còn hoạt động.
* Copy invite link còn hoạt động.
* Người dùng mới vẫn join được bằng link/QR.

---

## Bug 6: Cache không đồng bộ sau khi profile update

Nếu project đang dùng SWR/cache:

* Sau khi update profile phải invalidate/update các key liên quan.

Các key cần xem:

```txt
/api/me
/api/groups
/api/groups/[id]
```

Sau update profile:

```ts
await mutate("/api/me");
await mutate("/api/groups");
await mutate(
  (key) => typeof key === "string" && key.startsWith("/api/groups/")
);
```

Nếu có local client shell state thì cũng cần update currentUser ở shell.

Mục tiêu:

* Không cần reload.
* Không cần logout/login.
* Không cần vào group mới thấy avatar mới.

---

# Thứ tự ưu tiên sửa

1. Fix profile save vào MongoDB và không bị Google overwrite sau login.
2. Tạo/use `/api/me` làm single source cho current user.
3. Đồng bộ cache sau update profile.
4. Fix header/navbar/home/profile dùng current user mới.
5. Fix input contrast.
6. Remove join code UI, giữ QR + link.
7. Chạy test/build.

---

# Kiểm tra sau khi sửa

Chạy:

```bash
npm run lint
npm run build
```

Test thủ công:

1. Login Google.
2. Vào profile.
3. Đổi tên.
4. Đổi avatar.
5. Save.
6. Kiểm tra ngay:

   * Profile hiển thị tên/avatar mới.
   * Header/navbar avatar đổi.
   * Dashboard/home đổi.
   * Group member/avatar đổi.
7. Reload trang.
8. Kiểm tra tên/avatar vẫn còn.
9. Logout.
10. Login lại.
11. Kiểm tra tên/avatar vẫn giữ custom value, không bị reset về Google.
12. Test trên mobile viewport:

* input profile
* input add bill
* input create group
* các form còn lại

13. Kiểm tra invite UI:

* Không còn mã tham gia dạng text.
* Không còn ô nhập mã tham gia.
* QR còn.
* Copy link còn.
* Join bằng link/QR vẫn hoạt động.

---

# Báo cáo sau khi hoàn thành

Hãy báo lại:

1. Đã sửa/thêm những file nào.
2. Nguyên nhân tên/avatar bị mất sau login là gì.
3. Current user source hiện tại là gì: session hay `/api/me`.
4. Cách cache được cập nhật sau profile update.
5. Các màn đã kiểm tra avatar/name sync.
6. Các input/form đã sửa màu.
7. Các phần join code UI đã xóa.
8. QR/link invite còn hoạt động bằng route nào.
9. Có rủi ro còn lại không.

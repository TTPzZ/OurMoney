# Nhiệm vụ: Fix avatar API render, reset profile về mặc định Google, và member list trong group

## Bối cảnh

Project OurMoney đang dùng:

* Next.js App Router
* NextAuth Google Login
* MongoDB/Mongoose
* Vercel

Hiện tại khi upload/render avatar custom bị lỗi:

```txt
Bad request
INVALID_IMAGE_OPTIMIZE_REQUEST
```

Request lỗi:

```txt
/_next/image?url=%2Fapi%2Fuser%2Favatar%3FuserId%3D...&w=128&q=75
```

Điều này cho thấy app đang dùng Next `<Image />` để optimize ảnh từ internal API route:

```txt
/api/user/avatar?userId=...
```

Yêu cầu là sửa avatar render giống kiểu Google avatar: hiển thị trực tiếp, hỗ trợ cả GIF, không bị Vercel Image Optimization lỗi 400.

---

# Mục tiêu chính

1. Fix lỗi `INVALID_IMAGE_OPTIMIZE_REQUEST`.
2. Avatar custom và Google avatar đều hiển thị ổn.
3. Avatar GIF hiển thị được.
4. Có tính năng xóa tên custom để khôi phục tên mặc định từ Google.
5. Có tính năng xóa ảnh custom để khôi phục avatar mặc định từ Google.
6. Trong group, bấm vào cụm avatar thành viên góc phải để mở danh sách thành viên.

---

# Phần 1: Fix render avatar

## Vấn đề hiện tại

Có chỗ đang render avatar kiểu:

```tsx
<Image src={`/api/user/avatar?userId=${userId}&v=${...}`} ... />
```

Next/Vercel sẽ biến nó thành:

```txt
/_next/image?url=/api/user/avatar...
```

và gây lỗi 400 nếu API route không tương thích với Image Optimizer.

## Yêu cầu sửa

Tìm toàn bộ chỗ render avatar/user image/member image:

```bash
grep -R "next/image" src
grep -R "<Image" src
grep -R "avatar" src
grep -R "user.image" src
```

Với avatar người dùng, đổi sang component avatar chung, ví dụ:

```txt
src/components/UserAvatar.tsx
```

Component này nên dùng `<img>` thường, không dùng Next Image optimizer.

Ví dụ:

```tsx
type UserAvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
};

export function UserAvatar({
  src,
  name,
  size = 40,
  className = "",
}: UserAvatarProps) {
  const fallback = "/default-avatar.png";

  return (
    <img
      src={src || fallback}
      alt={name || "User avatar"}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
}
```

Nếu có lý do bắt buộc dùng Next Image, phải thêm `unoptimized`:

```tsx
<Image
  src={src || "/default-avatar.png"}
  alt={name || "User avatar"}
  width={size}
  height={size}
  unoptimized
/>
```

Nhưng ưu tiên `<img>` để hỗ trợ GIF và tránh lỗi optimize.

Acceptance:

* Không còn request `/_next/image?.../api/user/avatar...` cho avatar user.
* Avatar custom không còn lỗi 400.
* GIF avatar vẫn động.
* Google avatar vẫn hiển thị.

---

# Phần 2: Chuẩn hóa avatar URL

Hiện tại avatar có thể là:

* Google image URL
* Custom uploaded avatar
* API route `/api/user/avatar?userId=...`

Yêu cầu:

* UI chỉ cần nhận `displayImage`.
* `displayImage` ưu tiên custom avatar, nếu không có thì dùng Google avatar.

Trong User model nên có các field rõ ràng:

```ts
name: string
image?: string              // custom display avatar hoặc avatar hiện tại
googleName?: string
googleImage?: string
customName?: string
customImage?: string
```

Nếu chưa muốn migrate nhiều, có thể dùng logic:

```ts
displayName = user.name || user.googleName || user.email
displayImage = user.image || user.googleImage
```

Nhưng để hỗ trợ reset mặc định, nên tách:

```ts
googleName
googleImage
customName
customImage
```

Sau đó API `/api/me` trả:

```ts
{
  user: {
    _id,
    email,
    name: customName || googleName,
    image: customImage || googleImage,
    customName,
    customImage,
    googleName,
    googleImage
  }
}
```

---

# Phần 3: Không để Google overwrite custom profile khi login

Kiểm tra `src/auth.ts`.

Khi user login bằng Google:

* Nếu user chưa tồn tại: tạo user với googleName/googleImage.
* Nếu user đã tồn tại:

  * update `googleName`, `googleImage`, `email` nếu cần
  * KHÔNG overwrite `customName`, `customImage`
  * display name/avatar phải ưu tiên custom.

Pseudo:

```ts
let dbUser = await User.findOne({ googleId: profile.sub });

if (!dbUser) {
  dbUser = await User.create({
    googleId: profile.sub,
    email: user.email,
    googleName: user.name,
    googleImage: user.image,
    customName: null,
    customImage: null,
  });
} else {
  dbUser.email = user.email || dbUser.email;
  dbUser.googleName = user.name || dbUser.googleName;
  dbUser.googleImage = user.image || dbUser.googleImage;
  await dbUser.save();
}

token.userId = dbUser._id.toString();
token.name = dbUser.customName || dbUser.googleName;
token.picture = dbUser.customImage || dbUser.googleImage;
```

Acceptance:

* Đổi tên/avatar custom không bị mất sau logout/login.
* Google name/avatar chỉ là default.
* Custom profile luôn được ưu tiên.

---

# Phần 4: API cập nhật profile và reset về mặc định

Kiểm tra hoặc tạo:

```txt
GET /api/me
PATCH /api/me
```

## PATCH /api/me

Hỗ trợ update custom name/avatar:

```ts
{
  name?: string,
  image?: string
}
```

Khi nhận:

* `name` thì lưu vào `customName`
* `image` thì lưu vào `customImage`

## Reset name

Thêm action/API:

```txt
DELETE /api/me/name
```

hoặc dùng PATCH:

```ts
{
  resetName: true
}
```

Khi reset:

* set `customName = null`
* display name quay lại `googleName`

## Reset avatar

Thêm action/API:

```txt
DELETE /api/me/avatar
```

hoặc dùng PATCH:

```ts
{
  resetImage: true
}
```

Khi reset:

* set `customImage = null`
* display image quay lại `googleImage`

Acceptance:

* Bấm “Khôi phục tên mặc định” → tên quay lại Google name.
* Bấm “Khôi phục ảnh mặc định” → avatar quay lại Google avatar.
* Reload vẫn đúng.
* Logout/login vẫn đúng.

---

# Phần 5: UI Profile thêm nút reset

Trong profile edit UI thêm:

```txt
Khôi phục tên mặc định
Khôi phục ảnh mặc định
```

Chỉ hiện nút nếu đang có custom value:

```ts
if (user.customName) show reset name
if (user.customImage) show reset avatar
```

Sau khi reset:

* mutate `/api/me`
* mutate `/api/groups`
* mutate các `/api/groups/[id]` nếu dùng SWR
* update session nếu app đang dùng NextAuth `useSession().update()`

Pseudo:

```ts
await patchMe({ resetImage: true });

mutate("/api/me");
mutate("/api/groups");
mutate((key) => typeof key === "string" && key.startsWith("/api/groups/"));
```

---

# Phần 6: Fix `/api/user/avatar`

Nếu vẫn giữ route:

```txt
/api/user/avatar?userId=...
```

Đảm bảo route trả raw image đúng chuẩn:

* status 200
* header `Content-Type` đúng: `image/png`, `image/jpeg`, `image/gif`, `image/webp`
* không trả JSON khi thành công
* nếu không có avatar thì redirect hoặc trả default image hợp lệ
* có cache header hợp lý

Ví dụ:

```ts
return new NextResponse(buffer, {
  headers: {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=3600",
  },
});
```

Nhưng lưu ý:

* UI avatar vẫn không được render route này bằng Next `<Image />` optimize.
* Dùng `<img src="/api/user/avatar?...">`.

---

# Phần 7: Bấm avatar thành viên trong group để xem danh sách member

Hiện trong group có cụm avatar thành viên ở góc phải.

Yêu cầu:

* Cho phép click vào cụm avatar đó.
* Khi click, mở modal/drawer hiển thị danh sách thành viên group.

UI mong muốn:

* Tiêu đề: “Thành viên”
* Danh sách:

  * avatar
  * tên
  * email nếu app đang cho phép hiển thị, nếu không thì bỏ
* Có nút đóng.
* Mobile thân thiện.

Ví dụ component:

```txt
GroupMembersDialog
```

Trigger:

```tsx
<button onClick={() => setShowMembers(true)}>
  <AvatarStack members={group.members} />
</button>
```

Modal:

```tsx
<GroupMembersDialog
  open={showMembers}
  onClose={() => setShowMembers(false)}
  members={group.members}
/>
```

Yêu cầu:

* Avatar trong modal dùng component `UserAvatar`.
* Không dùng Next Image optimizer cho avatar.
* Nếu member có custom avatar thì hiển thị custom.
* Nếu không có custom avatar thì hiển thị Google avatar/default avatar.

Acceptance:

* Click avatar stack góc phải mở danh sách thành viên.
* Đóng modal hoạt động.
* Mobile hiển thị đẹp.
* Không lỗi ảnh avatar.

---

# Phần 8: Cache sync sau profile update/reset

Nếu app dùng SWR:

Sau update profile/reset:

```ts
mutate("/api/me");
mutate("/api/groups");
mutate((key) => typeof key === "string" && key.startsWith("/api/groups/"));
```

Mục tiêu:

* Header đổi ngay.
* Profile đổi ngay.
* Dashboard đổi ngay.
* Group member list đổi ngay.
* Bill/settlement hiển thị avatar/name mới nếu lấy từ group detail API.

---

# Test checklist

Chạy:

```bash
npm run lint
npm run build
```

Test thủ công:

1. Login bằng Google.
2. Google avatar GIF vẫn hiển thị.
3. Upload avatar custom.
4. Không còn lỗi `INVALID_IMAGE_OPTIMIZE_REQUEST`.
5. Không còn request 400 từ `/_next/image?.../api/user/avatar`.
6. Reload trang → avatar custom vẫn còn.
7. Logout/login lại → avatar custom vẫn còn.
8. Bấm khôi phục ảnh mặc định → quay lại Google avatar.
9. Reload/logout/login → vẫn là Google avatar.
10. Đổi tên custom → toàn app cập nhật.
11. Khôi phục tên mặc định → quay lại Google name.
12. Vào group → avatar/name đúng.
13. Click cụm avatar thành viên góc phải → mở danh sách thành viên.
14. Mobile view modal thành viên hoạt động tốt.
15. Không còn lỗi màu/input nếu có đụng UI profile.

---

# Báo cáo sau khi làm xong

Báo lại:

1. Đã sửa file nào.
2. Lý do lỗi `INVALID_IMAGE_OPTIMIZE_REQUEST`.
3. Avatar hiện dùng `<img>` hay `<Image unoptimized />`.
4. User model hiện lưu google/custom name/avatar thế nào.
5. Reset name/avatar hoạt động ra sao.
6. Các SWR cache key được mutate sau profile update.
7. Member list modal trong group nằm ở component nào.
8. Kết quả test build.

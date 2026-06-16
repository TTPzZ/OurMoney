# PHASE: INSTANT UI WITH CACHE-FIRST STRATEGY

## Context

Qua quá trình điều tra hiệu năng:

* Dashboard hiện đang preload nhiều group detail cùng lúc.
* Mỗi request `/api/groups/[id]` có thể mất từ 1s đến 7s.
* MongoDB connection và group detail query là các bottleneck chính.
* Hiện tại ứng dụng có xu hướng chờ dữ liệu từ server rồi mới hiển thị UI.
* Điều này làm người dùng cảm giác web chậm dù dữ liệu thực tế rất nhỏ.

Mục tiêu của phase này:

KHÔNG tối ưu database.
KHÔNG thêm websocket.
KHÔNG thay đổi business logic.

Chỉ thay đổi chiến lược hiển thị dữ liệu để tạo cảm giác tức thì.

---

# TASK 1 - REMOVE AGGRESSIVE GROUP PRELOAD

Tìm toàn bộ logic preload `/api/groups/[id]` trong Dashboard.

Loại bỏ việc:

* preload 5 group
* preload nhiều group song song khi vừa mở dashboard
* gọi hàng loạt request group detail khi user chưa click vào nhóm

Dashboard chỉ được phép:

* fetch danh sách nhóm
* hiển thị danh sách nhóm

KHÔNG fetch bill/settlement/group detail của từng nhóm khi user chưa mở nhóm đó.

---

# TASK 2 - CACHE FIRST DASHBOARD

Khi fetch `/api/groups`

Lưu dữ liệu vào:

localStorage

Ví dụ:

ourmoney_groups_cache

Kèm timestamp:

{
data: ...,
cachedAt: ...
}

---

Khi user mở Dashboard:

Ưu tiên:

1. Đọc cache
2. Hiển thị cache ngay lập tức
3. Fetch nền
4. Nếu dữ liệu mới khác cache thì cập nhật UI
5. Cập nhật lại localStorage

Người dùng phải nhìn thấy danh sách nhóm gần như ngay lập tức.

Không được loading toàn bộ trang chỉ vì đang đợi API.

---

# TASK 3 - CACHE FIRST GROUP DETAIL

Khi mở group:

Lưu cache theo key:

ourmoney_group_{groupId}

Nội dung:

{
group,
bills,
settlements,
cachedAt
}

---

Luồng mong muốn:

Lần đầu:

User click group
→ Fetch API
→ Hiển thị
→ Lưu cache

Lần sau:

User click group
→ Hiển thị cache ngay
→ Fetch nền
→ Nếu có dữ liệu mới thì cập nhật UI
→ Cập nhật cache

Không hiển thị loading toàn màn hình nếu cache tồn tại.

---

# TASK 4 - STALE WHILE REVALIDATE UX

Nếu cache tồn tại:

KHÔNG:

* skeleton toàn trang
* spinner toàn trang
* loading che toàn bộ nội dung

PHẢI:

Hiển thị dữ liệu cache trước.

Trong lúc fetch nền:

* loading nhỏ ở góc
  hoặc
* loading trong header

Người dùng vẫn thao tác được.

---

# TASK 5 - OPTIMISTIC GROUP NAVIGATION

Khi click group:

Nếu cache tồn tại:

Mở group ngay lập tức.

Không chờ API.

Sau khi màn hình đã mở:

Mới fetch nền để đồng bộ.

Mục tiêu:

Cảm giác chuyển trang phải tức thì.

---

# TASK 6 - OPTIMISTIC BILL CREATION

Khi tạo bill thành công:

KHÔNG:

* clear cache
* reload group
* chuyển về trạng thái loading toàn bộ

PHẢI:

* cập nhật cache group hiện tại
* cập nhật SWR cache
* hiển thị bill mới ngay

Sau đó mới sync nền nếu cần.

---

# TASK 7 - PRESERVE CURRENT LOGIC

Không thay đổi:

* Auth
* Permission
* Settlement logic
* Bill split logic
* API contract
* Database schema

Chỉ thay đổi UX và cache strategy.

---

# ACCEPTANCE CRITERIA

Dashboard:

* Không loading toàn màn hình nếu có cache.
* Không preload hàng loạt group detail.
* Danh sách nhóm xuất hiện gần như tức thì.

Group Detail:

* Nếu đã từng mở group thì mở lại gần như tức thì.
* Không loading toàn trang nếu cache tồn tại.
* Fetch nền để cập nhật dữ liệu mới.

Bill Creation:

* Không làm mất cache hiện có.
* Không tạo cảm giác tải lại toàn bộ nhóm.

Mục tiêu cuối cùng:

Người dùng phải cảm nhận ứng dụng phản hồi ngay lập tức dù backend vẫn cần vài giây để trả dữ liệu.

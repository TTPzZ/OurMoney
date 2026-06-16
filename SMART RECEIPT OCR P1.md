# PHASE: SMART RECEIPT OCR

## Context

Hiện tại tính năng OCR hóa đơn chỉ hỗ trợ điền dữ liệu cơ bản.

Mục tiêu:

Nâng cấp OCR để có thể:

* Nhận diện tổng tiền.
* Nhận diện từng món ăn/sản phẩm.
* Nhận diện số lượng.
* Nhận diện đơn giá.
* Nhận diện thành tiền của từng dòng.
* Tự động điền vào form tạo bill.

Không thay đổi business logic hiện tại.

---

# TASK 1 - IMPROVE OCR PROMPT

Kiểm tra API:

/api/ocr

Nếu đang dùng Gemini/OpenAI để parse hóa đơn.

Cập nhật prompt để model trả về JSON có cấu trúc:

{
merchant: string,
totalAmount: number,
subtotal: number | null,
tax: number | null,
serviceCharge: number | null,
items: [
{
name: string,
quantity: number,
unitPrice: number,
totalPrice: number
}
]
}

Yêu cầu:

* Chỉ trả JSON hợp lệ.
* Không trả markdown.
* Không trả giải thích.

---

# TASK 2 - EXTRACT ITEM DETAILS

OCR phải cố gắng lấy:

* tên món
* số lượng
* đơn giá
* thành tiền

Ví dụ:

Gà sốt cay x2 89.000

↓

{
name: "Gà sốt cay",
quantity: 2,
unitPrice: 89000,
totalPrice: 178000
}

---

# TASK 3 - AUTO FILL BILL FORM

Sau khi OCR thành công:

Tự động điền:

* description
* totalAmount

như hiện tại.

Ngoài ra:

Hiển thị danh sách item OCR được nhận diện.

Ví dụ:

☑ Gà sốt cay - 178.000
☑ Coca Cola - 45.000
☑ Khoai tây - 32.000

---

# TASK 4 - OCR REVIEW UI

Nếu OCR phát hiện item:

Hiển thị section:

"Chi tiết hóa đơn"

Người dùng có thể xem trước.

Không cho phép OCR tự sửa dữ liệu người dùng đã nhập thủ công.

Nếu user đã chỉnh sửa thì giữ giá trị user.

---

# TASK 5 - FALLBACK LOGIC

Nếu OCR không đọc được item:

Vẫn phải trả:

{
totalAmount: ...
}

để không làm hỏng luồng hiện tại.

Không được throw error chỉ vì thiếu item.

---

# TASK 6 - VALIDATION

Tổng tiền OCR:

Nếu:

sum(items)

khác

totalAmount

thì vẫn giữ totalAmount từ hóa đơn.

Không tự ý tính lại.

---

# ACCEPTANCE CRITERIA

* Chụp hóa đơn quán ăn có thể nhận diện nhiều món.
* Tổng tiền được nhận diện chính xác.
* Hiển thị danh sách món đọc được.
* Không làm hỏng flow tạo bill hiện tại.
* Nếu OCR thất bại một phần vẫn lấy được tổng tiền.
* Không thay đổi business logic chia tiền.

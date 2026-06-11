[CRITICAL FIX - NEXT.JS 16 DYNAMIC PARAMS] Hệ thống đang chạy Next.js 16 nên `params` trong các Server Components động bắt buộc phải là một Promise và phải được `await` trước khi sử dụng. Việc gọi trực tiếp `params.id` đang trả về undefined và gây ra lỗi 404 Not Found.

Hãy cập nhật CHÍNH XÁC cấu trúc của các file sau theo chuẩn Next.js 16:

1. File `src/app/group/[id]/page.tsx`:
Sửa lại định nghĩa hàm và unwrap params bằng await:
export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await getGroupById(id);
  // Sử dụng biến `id` thay vì `params.id` cho các logic phía dưới...
}

2. File `src/app/group/[id]/add-bill/page.tsx`:
Cập nhật tương tự:
export default async function AddBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Sử dụng biến `id`...
}

3. File `src/app/join/[code]/page.tsx` (Nếu có):
Cập nhật tương tự cho mã code:
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  // Sử dụng biến `code`...
}

Hãy ghi đè và cập nhật lại toàn bộ các file trên.
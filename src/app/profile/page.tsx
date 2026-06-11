import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Camera, Save, LogOut } from "lucide-react";
import Image from "next/image";
import { updateUserProfile } from "@/lib/actions/user";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const handleUpdate = async (formData: FormData) => {
    "use server";
    const name = formData.get("name") as string;
    const image = formData.get("image") as string;
    await updateUserProfile(name, image);
    redirect("/dashboard");
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-8 pt-4">
        <Link href="/dashboard" className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Cấu hình tài khoản</h1>
        <div className="w-10"></div>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Profile Info */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-200">
              {session.user.image ? (
                <Image src={session.user.image} alt="Avatar" width={128} height={128} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                  {session.user.name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white border-2 border-white shadow-lg">
              <Camera size={20} />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-900">{session.user.name}</h2>
            <p className="text-sm font-medium text-gray-400">{session.user.email}</p>
          </div>
        </div>

        {/* Form */}
        <form action={handleUpdate} className="space-y-6">
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tên hiển thị</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={session.user.name || ""}
                  className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 outline-none focus:border-indigo-600 transition-colors font-bold"
                  placeholder="Nhập tên của bạn"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">URL Ảnh đại diện</label>
                <input
                  name="image"
                  type="text"
                  defaultValue={session.user.image || ""}
                  className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 outline-none focus:border-indigo-600 transition-colors font-bold text-xs"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform"
            >
              <Save size={24} />
              Lưu thay đổi
            </button>
          </div>
        </form>

        <form action={async () => {
          "use server";
          await signOut();
          redirect("/");
        }}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-white text-red-500 py-4 rounded-2xl font-bold text-lg shadow-sm border border-red-50 active:scale-95 transition-transform"
          >
            <LogOut size={24} />
            Đăng xuất
          </button>
        </form>
      </div>
    </main>
  );
}

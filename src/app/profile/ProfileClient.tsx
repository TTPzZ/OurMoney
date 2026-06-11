"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Camera, Save, LogOut, Upload } from "lucide-react";
import Image from "next/image";
import { updateUserProfile } from "@/lib/actions/user";
import ActionButton from "@/components/ActionButton";

export default function ProfileClient({ 
  initialName, 
  initialImage,
  email
}: { 
  initialName: string;
  initialImage: string;
  email: string;
}) {
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState(initialImage);
  const [isPending, startTransition] = useTransition();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Kích thước ảnh tối đa là 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = () => {
    startTransition(async () => {
      try {
        await updateUserProfile(name, image);
        await update({ name, image }); // Sync session
        alert("Cập nhật thành công!");
      } catch (error: any) {
        alert(error.message || "Đã có lỗi xảy ra");
      }
    });
  };

  // Fallback to ui-avatars.com if image is missing
  const displayImage = image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random`;

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Profile Info */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-200">
            <Image 
              src={displayImage} 
              alt="Avatar" 
              width={128} 
              height={128} 
              className="object-cover w-full h-full" 
            />
          </div>
          <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white border-2 border-white shadow-lg cursor-pointer active:scale-95 transition-transform">
            <Upload size={20} />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload}
              disabled={isPending}
            />
          </label>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900">{name}</h2>
          <p className="text-sm font-medium text-gray-400">{email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tên hiển thị</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 outline-none focus:border-indigo-600 transition-colors font-bold disabled:opacity-50"
                placeholder="Nhập tên của bạn"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleUpdate}
            disabled={isPending || !name.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
          >
            <Save size={24} />
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

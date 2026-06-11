"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Camera, Save, LogOut, Upload, User, Mail, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { updateUserProfile } from "@/lib/actions/user";
import Avatar from "@/components/Avatar";

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

  return (
    <div className="w-full max-w-md space-y-10">
      {/* Profile Info Header */}
      <div className="flex flex-col items-center space-y-6">
        <div className="relative group">
          <div className="w-36 h-32 relative">
             <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 mx-auto">
              <Avatar src={image} name={name || "U"} size={128} />
            </div>
            <label className="absolute bottom-0 right-2 p-3 bg-indigo-600 rounded-2xl text-white border-4 border-white shadow-xl cursor-pointer active:scale-90 transition-all hover:bg-indigo-700">
              <Camera size={20} />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={isPending}
              />
            </label>
          </div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-900 leading-tight">{name}</h2>
          <div className="flex items-center justify-center gap-1.5 text-slate-400">
            <Mail size={12} />
            <p className="text-xs font-bold uppercase tracking-wider">{email}</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <User size={14} className="text-slate-400" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thông tin cá nhân</h3>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 ml-1">Tên hiển thị</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                className="w-full bg-slate-50 px-5 py-4 rounded-2xl border border-transparent outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold text-slate-900 disabled:opacity-50"
                placeholder="Nhập tên của bạn"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <ShieldCheck size={20} />
             </div>
             <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Trạng thái tài khoản</p>
                <p className="text-xs font-black text-slate-900 uppercase">Đã xác thực Google</p>
             </div>
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={isPending || !name.trim()}
          className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-2xl shadow-indigo-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 hover:bg-indigo-700"
        >
          {isPending ? (
             <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Save size={24} />
              LƯU THAY ĐỔI
            </>
          )}
        </button>
      </div>
    </div>
  );
}

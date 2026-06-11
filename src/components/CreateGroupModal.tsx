"use client";

import { useState } from "react";
import { Plus, X, Sparkles, Check } from "lucide-react";
import { createGroup } from "@/lib/actions/group";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";

export default function CreateGroupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsPending(true);
    try {
      const result = await createGroup(name);
      if (result.success) {
        mutate("/api/groups");
        setIsOpen(false);
        setName("");
        router.push(`/group/${result.groupId}`);
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Không thể tạo nhóm. Vui lòng thử lại.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-5 rounded-[1.5rem] font-black text-lg shadow-2xl shadow-indigo-200 active:scale-95 transition-all hover:bg-indigo-700 w-full"
      >
        <Plus className="h-6 w-6" strokeWidth={3} />
        TẠO NHÓM MỚI
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="flex justify-between items-center mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <Sparkles className="text-indigo-500" size={16} />
                   <h2 className="text-xl font-black text-slate-900 leading-none">Bắt đầu nhóm mới</h2>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Sòng phẳng mới là tri kỷ</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-1">Tên gọi của nhóm</label>
                <input
                  type="text"
                  placeholder='Ví dụ: "Ăn trưa", "Du lịch"...'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-50 px-6 py-5 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none text-lg font-black text-slate-900 transition-all placeholder:text-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 active:scale-[0.98] transition-all disabled:opacity-30 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isPending ? (
                   <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check size={20} strokeWidth={3} />
                    XÁC NHẬN TẠO
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

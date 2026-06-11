"use client";

import { useState } from "react";
import { Plus, X, Sparkles, Check, Hash } from "lucide-react";
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
        className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-primary py-5 text-lg font-black text-white shadow-2xl shadow-primary/30 transition-all hover:bg-indigo-700 active:scale-95 dark:shadow-none"
      >
        <Plus size={24} strokeWidth={3} />
        CREATE NEW GROUP
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 dark:bg-slate-900">
            <div className="flex justify-between items-center mb-8">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                   <Sparkles className="text-primary" size={16} />
                   <h2 className="text-xl font-black text-slate-900 leading-none dark:text-white">Start a Group</h2>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-0.5">Sòng phẳng mới là tri kỷ</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors dark:bg-slate-800 dark:text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-1 dark:text-slate-600">Group Name</label>
                <div className="relative group">
                   <input
                    type="text"
                    placeholder='e.g. "Dinner", "Trip to Bali"'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-50 px-6 py-5 rounded-3xl border-2 border-transparent focus:border-primary focus:bg-white outline-none text-lg font-black text-slate-900 transition-all placeholder:text-slate-200 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-700 dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-slate-200 active:scale-[0.98] transition-all disabled:opacity-30 disabled:active:scale-100 flex items-center justify-center gap-2 dark:bg-primary dark:shadow-none"
              >
                {isPending ? (
                   <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check size={20} strokeWidth={3} />
                    CONFIRM
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

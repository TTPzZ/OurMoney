"use client";

import { useState, useTransition } from "react";
import { joinGroupByCode } from "@/lib/actions/group";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, ArrowRight } from "lucide-react";
import { useSWRConfig } from "swr";

export default function JoinGroupForm() {
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const handleJoin = () => {
    if (!code.trim()) return;
    
    startTransition(async () => {
      try {
        const result = await joinGroupByCode(code.trim());
        if (result.success) {
          mutate("/api/groups");
          router.push(`/group/${result.groupId}`);
        }
      } catch (error: any) {
        alert(error.message || "Không thể tham gia nhóm");
      }
    });
  };

  return (
    <div className="group relative flex gap-2 bg-white p-2.5 rounded-[1.5rem] border border-slate-200/60 shadow-sm focus-within:shadow-xl focus-within:shadow-indigo-500/5 focus-within:border-indigo-200 transition-all">
      <input
        type="text"
        placeholder="Nhập mã mời 10 ký tự..."
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        disabled={isPending}
        className="flex-1 bg-transparent px-4 py-2 outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300 tracking-wider"
      />
      <button
        onClick={handleJoin}
        disabled={isPending || !code.trim()}
        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[11px] font-black shadow-lg active:scale-95 transition-all disabled:opacity-30 uppercase tracking-widest hover:bg-slate-800"
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            <span>Vào nhóm</span>
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { joinGroupByCode } from "@/lib/actions/group";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, ArrowRight, Hash } from "lucide-react";
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
    <div className="group relative flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-1.5 transition-all focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10 dark:border-slate-800 dark:bg-slate-900/50 dark:focus-within:border-primary/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm dark:bg-slate-800">
        <Hash size={18} strokeWidth={2.5} />
      </div>
      <input
        type="text"
        placeholder="Enter 10-char code..."
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        disabled={isPending}
        className="flex-1 bg-transparent px-2 py-2 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300 dark:text-white dark:placeholder:text-slate-600 tracking-wider"
      />
      <button
        onClick={handleJoin}
        disabled={isPending || !code.trim()}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-30 dark:bg-primary dark:hover:bg-indigo-500"
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            <span>Join</span>
            <ArrowRight size={14} strokeWidth={3} />
          </>
        )}
      </button>
    </div>
  );
}

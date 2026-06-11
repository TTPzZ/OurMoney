"use client";

import { useState, useTransition } from "react";
import { joinGroupByCode } from "@/lib/actions/group";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
import { useSWRConfig } from "swr";

export default function JoinGroupForm({
  onOpenGroup,
}: {
  onOpenGroup?: (groupId: string) => void;
}) {
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
          if (onOpenGroup) {
            onOpenGroup(result.groupId);
          } else {
            router.push(`/group/${result.groupId}`);
          }
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Không thể tham gia nhóm";
        alert(message);
      }
    });
  };

  return (
    <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
      <input
        type="text"
        placeholder="Nhập mã tham gia..."
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        disabled={isPending}
        className="flex-1 bg-transparent px-4 py-2 outline-none text-sm font-bold placeholder:text-gray-300"
      />
      <button
        onClick={handleJoin}
        disabled={isPending || !code.trim()}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <UserPlus size={14} />
        )}
        Tham gia
      </button>
    </div>
  );
}

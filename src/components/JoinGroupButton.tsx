"use client";

import { useState } from "react";
import { joinGroupByCode as joinGroup } from "@/lib/actions/group";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

export default function JoinGroupButton({ inviteCode }: { inviteCode: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleJoin() {
    setIsPending(true);
    setError("");

    try {
      const result = await joinGroup(inviteCode);
      router.push(`/group/${result.groupId}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to join group";
      setError(errorMessage);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl text-center">
          {error}
        </p>
      )}
      <button
        onClick={handleJoin}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50"
      >
        <UserPlus size={24} />
        {isPending ? "Joining..." : "Join Group"}
      </button>
    </div>
  );
}

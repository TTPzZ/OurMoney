"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createGroup } from "@/lib/actions/group";
import { useRouter } from "next/navigation";

export default function CreateGroupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsPending(true);
    try {
      const result = await createGroup(name);
      if (result.success) {
        setIsOpen(false);
        setName("");
        router.push(`/group/${result.groupId}`);
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Failed to create group. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform min-h-[56px] w-full max-w-sm"
      >
        <Plus className="h-6 w-6" />
        Tạo nhóm mới
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Tên nhóm của bạn</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="text"
                placeholder='Ví dụ: "Ăn trưa", "Du lịch Đà Lạt"'
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-lg transition-all"
              />

              <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {isPending ? "Đang tạo..." : "Xác nhận"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

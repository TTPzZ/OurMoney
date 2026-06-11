"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import Avatar from "@/components/Avatar";
import type { GroupMember } from "@/lib/money-types";

export default function GroupMembersDialog({
  open,
  onClose,
  members,
}: {
  open: boolean;
  onClose: () => void;
  members: GroupMember[];
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-members-title"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 id="group-members-title" className="text-lg font-black text-gray-900">
              Thành viên
            </h2>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {members.length} người trong nhóm
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-500 shadow-sm active:scale-95"
            aria-label="Đóng danh sách thành viên"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto py-4">
          {members.map((member) => (
            <div key={member._id} className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white bg-gray-200 shadow-sm">
                <Avatar src={member.image} name={member.name} size={44} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">{member.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

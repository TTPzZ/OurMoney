"use client";

import { useEffect } from "react";
import { X, UserCircle } from "lucide-react";
import Avatar from "@/components/Avatar";

interface GroupMember {
  _id: string;
  name: string;
  image?: string;
  email?: string;
}

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-members-title"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 shadow-2xl sm:rounded-[2.5rem] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-6 mb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserCircle className="text-primary" size={18} />
              <h2 id="group-members-title" className="text-xl font-black text-slate-900 leading-none">
                Thành viên
              </h2>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-0.5">
              {members.length} người trong nhóm
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors active:scale-95"
            aria-label="Đóng danh sách thành viên"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto py-4 no-scrollbar">
          {members.map((member) => (
            <div key={member._id} className="group flex items-center gap-4 rounded-3xl border border-slate-50 bg-slate-50/30 p-3 transition-colors hover:bg-slate-50">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-slate-200 shadow-sm transition-transform group-hover:scale-105">
                <Avatar src={member.image} name={member.name} size={48} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{member.name}</p>
                {member.email && <p className="truncate text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{member.email}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-50">
           <button 
             onClick={onClose}
             className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-[0.98] transition-all hover:bg-slate-800"
           >
             Đóng lại
           </button>
        </div>
      </div>
    </div>
  );
}

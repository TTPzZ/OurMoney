"use client";

import { X } from "lucide-react";
import AddBillForm from "./AddBillForm";

interface Member {
  _id: string;
  name: string;
  image?: string | null;
}

interface AddBillModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  members: Member[];
  currentUserId: string;
}

export default function AddBillModal({
  open,
  onClose,
  groupId,
  members,
  currentUserId,
}: AddBillModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 sm:items-center transition-all animate-in fade-in duration-200">
      <div 
        className="relative max-h-[90vh] w-full max-w-xl overflow-hidden rounded-3xl bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Thêm hóa đơn</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto flex-1">
          <AddBillForm
            groupId={groupId}
            members={members}
            currentUserId={currentUserId}
            onSuccess={onClose}
            onCancel={onClose}
            isModal={true}
          />
        </div>
      </div>
      
      {/* Backdrop click to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  );
}

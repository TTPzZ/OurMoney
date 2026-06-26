"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import Avatar from "@/components/Avatar";

export default function PaymentQRModal({
  open,
  onClose,
  userId,
  userName,
  userImage,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userImage?: string | null;
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
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-qr-title"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-50 shadow-sm">
              <Avatar src={userImage} name={userName} size={40} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thanh toán cho</p>
              <h2 id="payment-qr-title" className="text-sm font-black text-gray-900 truncate max-w-[150px]">
                {userName}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-500 shadow-sm active:scale-95 transition-transform"
            aria-label="Đóng mã QR"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-4 border-2 border-dashed border-gray-200 aspect-square">
          <img 
            src={`/api/user/qr?userId=${userId}`} 
            alt={`Mã QR của ${userName}`} 
            className="w-full h-full object-contain rounded-xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&text=No+QR`;
            }}
          />
        </div>
        
        <p className="text-center text-xs font-medium text-gray-400 mt-4 px-2">
          Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã này.
        </p>
      </div>
    </div>
  );
}

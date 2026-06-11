"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";

interface ActionButtonProps {
  action: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
}

export default function ActionButton({ 
  action, 
  children, 
  className = "", 
  loadingText = "Đang xử lý...",
  variant = "primary"
}: ActionButtonProps) {
  const [isPending, startTransition] = useTransition();

  const variants = {
    primary: "bg-indigo-600 text-white shadow-md active:scale-95",
    secondary: "bg-gray-100 text-gray-600 active:scale-95",
    danger: "bg-red-50 text-red-500 border border-red-100 active:scale-95",
    ghost: "text-gray-400 active:scale-95",
    success: "bg-green-500 text-white shadow-md active:scale-95"
  };

  const handleAction = () => {
    startTransition(async () => {
      try {
        await action();
      } catch (error: any) {
        alert(error.message || "Đã có lỗi xảy ra");
      }
    });
  };

  return (
    <button
      onClick={handleAction}
      disabled={isPending}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${className}`}
    >
      {isPending ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

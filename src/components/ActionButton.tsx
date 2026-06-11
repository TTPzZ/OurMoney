"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";

interface ActionButtonProps {
  action: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  disabled?: boolean;
}

export default function ActionButton({ 
  action, 
  children, 
  className = "", 
  loadingText,
  variant = "primary",
  size = "md",
  disabled = false
}: ActionButtonProps) {
  const [isPending, startTransition] = useTransition();

  const variants = {
    primary: "bg-primary text-white hover:bg-indigo-700 shadow-sm shadow-primary/20",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
    success: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
    outline: "bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-2xl",
    icon: "p-2 rounded-xl"
  };

  const handleAction = () => {
    startTransition(async () => {
      try {
        await action();
      } catch (error: any) {
        // We keep the logic but can polish the alert if we had a toast system
        // Since we are not allowed to add new features/libs, we keep alert for now
        alert(error.message || "Đã có lỗi xảy ra");
      }
    });
  };

  return (
    <button
      onClick={handleAction}
      disabled={isPending || disabled}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {isPending ? (
        <>
          <Loader2 size={size === "sm" ? 12 : 16} className="animate-spin" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

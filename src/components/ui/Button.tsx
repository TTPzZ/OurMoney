"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "success";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-indigo-600 text-white shadow-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500/20",
    secondary: "bg-slate-100 text-slate-600 hover:bg-slate-200 focus:ring-2 focus:ring-slate-500/10",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 focus:ring-2 focus:ring-red-500/10",
    ghost: "text-slate-400 hover:bg-slate-50 hover:text-slate-600",
    outline: "bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50",
    success: "bg-emerald-500 text-white shadow-md hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px] rounded-lg",
    md: "px-4 py-2 text-xs rounded-xl",
    lg: "px-6 py-3 text-sm rounded-2xl",
    xl: "px-8 py-4 text-lg rounded-2xl"
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={size === "xl" ? 24 : 16} className="animate-spin" />
          {loadingText || children}
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
}

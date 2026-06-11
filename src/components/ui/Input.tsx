"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  className = "",
  containerClassName = "",
  ...props
}: InputProps) {
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          className={`
            w-full rounded-xl border bg-white px-3 py-2 text-sm transition-all outline-none
            placeholder:text-slate-400 text-slate-900
            ${leftIcon ? "pl-10" : "pl-4"}
            ${rightIcon ? "pr-10" : "pr-4"}
            ${error 
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10" 
              : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            }
            disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
            dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-500 px-1">{error}</p>
      )}
    </div>
  );
}

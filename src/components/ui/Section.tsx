"use client";

import React from "react";

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export default function Section({
  title,
  icon,
  children,
  action,
  className = "",
}: SectionProps) {
  return (
    <section className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center px-1">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

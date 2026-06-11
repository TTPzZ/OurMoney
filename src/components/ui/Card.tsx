"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({
  children,
  className = "",
  onClick,
  hover = false,
}: CardProps) {
  const Component = onClick ? "button" : "div";
  
  return (
    <Component
      onClick={onClick}
      className={`
        w-full text-left bg-white rounded-3xl border border-slate-100 shadow-sm transition-all
        ${hover || onClick ? "hover:shadow-md active:scale-[0.99]" : ""}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

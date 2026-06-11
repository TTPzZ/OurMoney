"use client";

import Image from "next/image";
import { useState } from "react";
import { User } from "lucide-react";

export default function Avatar({ 
  src, 
  name, 
  size = 40,
  className = "" 
}: { 
  src?: string | null; 
  name: string; 
  size?: number;
  className?: string;
}) {
  const [error, setError] = useState(false);

  // Fallback to ui-avatars if src is missing or fails to load
  const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=6366f1&color=fff&bold=true`;
  const displaySrc = (!src || error) ? fallbackSrc : src;

  return (
    <div 
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={displaySrc}
        alt={name || "User"}
        width={size}
        height={size}
        className="aspect-square h-full w-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}

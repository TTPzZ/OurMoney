import Image from "next/image";

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
  const displaySrc = src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random`;

  return (
    <Image
      src={displaySrc}
      alt={name}
      width={size}
      height={size}
      className={`object-cover w-full h-full ${className}`}
    />
  );
}

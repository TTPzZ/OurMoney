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
    // User avatars can be internal API images or GIFs, so they bypass Next image optimization.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displaySrc}
      alt={name}
      width={size}
      height={size}
      className={`object-cover w-full h-full ${className}`}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
}

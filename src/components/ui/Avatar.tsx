import Image from "next/image";

export function Avatar({ src, name, size = 36 }: { src?: string | null; name: string; size?: number }) {
  const initials = name.slice(0, 2).toUpperCase();
  return src ? (
    <Image src={src} alt="" width={size} height={size} className="rounded-full border border-ink-600 object-cover" style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden className="inline-flex items-center justify-center rounded-full border border-ink-600 bg-ink-800 font-display text-ash-300"
      style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials}</span>
  );
}

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

/**
 * No celular: um toque abre a publicação; dois toques rápidos curtem (coração grande, como no Instagram).
 * No computador o link funciona normalmente. A curtida em si é feita pela barra de ações (evento "igreja:like").
 */
export function DoubleTapLike({ postId, href, className, children }: { postId: string; href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  const last = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hearts, setHearts] = useState<number[]>([]);

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || !window.matchMedia("(pointer: coarse)").matches) return; // computador: link normal
    e.preventDefault();
    const now = Date.now();
    if (now - last.current < 300) {
      if (timer.current) clearTimeout(timer.current);
      last.current = 0;
      const id = now;
      setHearts((h) => [...h, id]);
      setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 900);
      window.dispatchEvent(new CustomEvent("igreja:like", { detail: postId }));
      return;
    }
    last.current = now;
    timer.current = setTimeout(() => router.push(href), 300);
  }

  return (
    <Link href={href} onClick={onClick} className={`relative ${className ?? ""}`}>
      {children}
      {hearts.map((id) => (
        <svg key={id} aria-hidden viewBox="0 0 24 24" className="big-heart pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 text-poster drop-shadow-2xl">
          <path fill="currentColor" d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
        </svg>
      ))}
    </Link>
  );
}

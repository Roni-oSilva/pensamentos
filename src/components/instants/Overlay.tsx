"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Tela cheia de verdade: renderiza no <body>, fora de qualquer animação/transform da página, e trava a rolagem. */
export function Overlay({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return ready ? createPortal(children, document.body) : null;
}

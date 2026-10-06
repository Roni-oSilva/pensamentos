import Link from "next/link";

/** Botão flutuante “+” para publicar (celular e app). */
export function ComposeFab({ href = "/comunidade/nova", label = "Publicar uma palavra" }: { href?: string; label?: string }) {
  return (
    <Link href={href} prefetch={false} aria-label={label} title={label}
      className="compose-fab no-print fixed right-4 z-[56] grid h-14 w-14 place-items-center rounded-full bg-poster text-white shadow-[0_10px_30px_rgba(232,69,60,.35)] transition active:scale-90 md:hidden">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
    </Link>
  );
}

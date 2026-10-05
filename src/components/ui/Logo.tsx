import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex flex-col leading-none" aria-label="Heresias que passam pela minha cabeça — início">
      <span className="font-display text-lg font-semibold uppercase tracking-[0.22em] text-white sm:text-xl">Heresias</span>
      {!compact && <span className="mt-1 hidden text-[10px] uppercase tracking-[0.28em] text-ash-400 transition-colors group-hover:text-ash-200 sm:block">que passam pela minha cabeça</span>}
    </Link>
  );
}

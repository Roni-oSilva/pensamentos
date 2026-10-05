import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex flex-col leading-none" aria-label="Heresias que passam pela minha cabeça — início">
      <span className="font-poster text-2xl uppercase tracking-[0.12em] text-poster sm:text-3xl">Heresias</span>
      {!compact && <span className="mt-1 hidden text-[10px] uppercase tracking-[0.28em] text-ash-400 transition-colors group-hover:text-ash-200 sm:block">que passam pela minha cabeça</span>}
    </Link>
  );
}

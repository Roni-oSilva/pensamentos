import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3 leading-none" aria-label="Igreja de Cristo — início">
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-poster/70 text-lg text-poster transition group-hover:bg-poster group-hover:text-ink-950">✝</span>
      <span className="flex flex-col">
        <span className="church-name text-[1.55rem] text-white sm:text-[1.85rem]">Igreja de <span className="text-poster">Cristo</span></span>
        {!compact && <span className="mt-1.5 hidden text-[10px] uppercase tracking-[0.26em] text-ash-400 transition-colors group-hover:text-ash-200 sm:block">Comunidade · Palavra · Louvor</span>}
      </span>
    </Link>
  );
}

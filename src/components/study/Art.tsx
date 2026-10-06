import type { SymbolName } from "@/lib/study/content";

/** Ilustrações originais da Área de Estudo (sem imagens externas): símbolos, banner da aula, medalhão do herói e linha do tempo. */
const PATHS: Record<SymbolName, React.ReactNode> = {
  livro: <><path d="M4 5.5C6.5 4 9.5 4 12 5.5v13C9.5 17 6.5 17 4 18.5z" /><path d="M12 5.5C14.5 4 17.5 4 20 5.5v13C17.5 17 14.5 17 12 18.5" /></>,
  sol: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  cruz: <path d="M12 3v18M6 9h12" />,
  coracao: <path d="M12 20s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 5c-2.3 4.6-9.3 9-9.3 9Z" />,
  arvore: <><path d="M12 21v-7" /><path d="M12 14c-4 0-6-3-5-6 1-3 5-5 5-5s4 2 5 5c1 3-1 6-5 6Z" /></>,
  pomba: <path d="M3 13c3-1 5-3 6-6 3 1 5 3 5 6 2 0 4 1 7 3-3 0-5-1-7-1-1 3-4 5-8 4 1-1 1-2 1-3-2 0-3-1-4-3Z" />,
  agua: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />,
  igreja: <><path d="M12 3v4M10 5h4" /><path d="M6 21V12l6-5 6 5v9z" /><path d="M10 21v-5h4v5" /></>,
  pao: <><path d="M4 14c0-4 3-7 8-7s8 3 8 7v3H4z" /><path d="M9 11l1 2M13 10l1 2" /></>,
  luz: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3 11c.7.6 1 1.4 1 2h4c0-.6.3-1.4 1-2a6 6 0 0 0-3-11Z" /></>,
  cajado: <path d="M9 21V9a4 4 0 1 1 8 0" />,
  tumulo: <><path d="M4 21V12a8 8 0 0 1 16 0v9z" /><path d="M9 21v-6a3 3 0 0 1 6 0v6" /></>,
  videira: <><path d="M12 21V8" /><path d="M12 8c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 12c3 0 5-2 5-5-3 0-5 2-5 5Z" /><circle cx="9" cy="17" r="1.4" /><circle cx="15" cy="17" r="1.4" /><circle cx="12" cy="19.5" r="1.4" /></>,
  maos: <path d="M12 3c-2 3-3 6-3 9v9l3-2 3 2v-9c0-3-1-6-3-9Z" />,
  chama: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9Z" />,
};

const HUE: Record<string, number> = { "fundamentos-da-fe": 215, "evangelho-de-joao": 38, "a-vida-de-oracao": 275, "avivamentos-e-avivalistas": 8 };
const hue = (slug: string) => HUE[slug] ?? 200;

export function SymbolIcon({ name, size = 24, className = "" }: { name: SymbolName; size?: number; className?: string }) {
  return <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>{PATHS[name]}</svg>;
}

/** Banner da aula: fundo escuro com cor da trilha e o símbolo da aula em destaque. */
export function LessonBanner({ slug, symbol, label, verse }: { slug: string; symbol: SymbolName; label: string; verse: string }) {
  const h = hue(slug);
  return (
    <div role="img" aria-label={`Ilustração da aula: ${label}`} className="force-dark relative isolate overflow-hidden rounded-2xl border border-ink-700" style={{ background: `linear-gradient(135deg, hsl(${h} 45% 14%), hsl(${(h + 40) % 360} 55% 6%))` }}>
      <div aria-hidden className="absolute -right-6 -top-6 text-white/15"><SymbolIcon name={symbol} size={260} /></div>
      <div aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(circle at 20% 110%, hsl(${h} 70% 55% / .35), transparent 55%)` }} />
      <div className="relative flex min-h-[170px] flex-col justify-end gap-1 p-6 sm:min-h-[210px] sm:p-8">
        <span className="text-xs uppercase tracking-[0.18em] text-white/70">{label}</span>
        <span className="font-display text-3xl italic text-white sm:text-4xl">{verse}</span>
      </div>
    </div>
  );
}

const initials = (name: string) => {
  const words = name.replace(/,/g, " ").split(/\s+/).filter((w) => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(w));
  const a = words[0]?.[0] ?? "?", b = words.length > 1 ? words[words.length - 1]![0] : "";
  return `${a}${b}`;
};

/** Medalhão do herói da fé (iniciais sobre fundo com a cor da trilha). */
export function Medallion({ slug, name, symbol }: { slug: string; name: string; symbol: SymbolName }) {
  const h = hue(slug);
  return (
    <div aria-hidden className="force-dark relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-white/30 text-white sm:h-24 sm:w-24" style={{ background: `radial-gradient(circle at 30% 25%, hsl(${h} 60% 38%), hsl(${h} 50% 12%))` }}>
      <SymbolIcon name={symbol} size={64} className="absolute text-white/15" />
      <span className="relative font-display text-3xl italic sm:text-4xl">{initials(name)}</span>
    </div>
  );
}

/** Capa pequena da trilha, para os cartões. */
export function TrackCover({ slug, symbol }: { slug: string; symbol: SymbolName }) {
  const h = hue(slug);
  return (
    <div aria-hidden className="force-dark relative grid h-24 place-items-center overflow-hidden rounded-xl text-white" style={{ background: `linear-gradient(135deg, hsl(${h} 45% 16%), hsl(${(h + 40) % 360} 55% 7%))` }}>
      <SymbolIcon name={symbol} size={96} className="absolute -right-2 -top-2 text-white/20" />
      <SymbolIcon name={symbol} size={34} className="relative" />
    </div>
  );
}

/** Linha do tempo vertical. */
export function Timeline({ items }: { items: { ano: string; fato: string }[] }) {
  return (
    <ol className="relative space-y-4 border-l border-ink-600 pl-6">
      {items.map((i) => (
        <li key={i.ano + i.fato} className="relative">
          <span aria-hidden className="absolute -left-[1.72rem] top-1.5 h-2.5 w-2.5 rounded-full bg-ash-100" />
          <p className="text-sm font-semibold tabular-nums text-white">{i.ano}</p>
          <p className="text-sm text-ash-300">{i.fato}</p>
        </li>
      ))}
    </ol>
  );
}

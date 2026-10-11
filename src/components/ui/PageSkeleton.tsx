/** Esqueleto de página: aparece na hora em que a pessoa toca numa aba/link, enquanto o conteúdo chega. */
export function PageSkeleton({ variant = "list" }: { variant?: "list" | "grid" | "profile" }) {
  const bar = "animate-pulse rounded-lg bg-ink-800";
  return (
    <div className="container-wide pt-10" role="status" aria-label="Carregando">
      {variant === "profile" ? (
        <div className="flex items-center gap-5">
          <span className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-ink-800" />
          <div className="flex-1 space-y-3"><div className={`${bar} h-10 w-2/3`} /><div className={`${bar} h-4 w-1/3`} /></div>
        </div>
      ) : (
        <div className="space-y-3"><div className={`${bar} h-3 w-24`} /><div className={`${bar} h-12 w-3/4 max-w-md`} /><div className={`${bar} h-4 w-full max-w-xl`} /></div>
      )}
      <div className={`mt-10 grid gap-4 ${variant === "grid" ? "grid-cols-2 md:grid-cols-3" : ""}`}>
        {Array.from({ length: variant === "grid" ? 6 : 4 }, (_, i) => (
          <div key={i} className="card space-y-3 p-5" style={{ opacity: 1 - i * 0.15 }}>
            <div className={`${bar} h-4 w-1/3`} /><div className={`${bar} h-5 w-full`} /><div className={`${bar} h-5 w-5/6`} />
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

/** Barra de progresso acessível. `pct` de 0 a 100. */
export function ProgressBar({ pct, label, className = "" }: { pct: number; label: string; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} className={`h-2 overflow-hidden rounded-full bg-ink-700 ${className}`}>
      <div className="h-full rounded-full bg-ash-100 transition-[width] duration-700 ease-out" style={{ width: `${v}%` }} />
    </div>
  );
}

export default function AdminLoading() {
  return (
    <div role="status" aria-label="Carregando" className="animate-pulse space-y-5">
      <div className="h-10 w-56 rounded bg-ink-800" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-28 rounded-lg border border-ink-700 bg-ink-900/70" />)}
      </div>
      <div className="h-64 rounded-lg border border-ink-700 bg-ink-900/70" />
    </div>
  );
}

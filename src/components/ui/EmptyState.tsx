export function EmptyState({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="font-display text-2xl text-ash-200">{title}</p>
      {hint && <p className="max-w-md text-sm text-ash-400">{hint}</p>}
      {children}
    </div>
  );
}

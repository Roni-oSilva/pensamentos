export default function Loading() {
  return (
    <div className="container-wide flex min-h-[50vh] items-center justify-center" role="status" aria-label="Carregando">
      <span className="animate-flicker font-display text-2xl italic text-ash-400">carregando…</span>
    </div>
  );
}

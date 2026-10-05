export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="container-narrow py-16">
      <p className="eyebrow mb-3">Atualizado em {updated}</p>
      <h1 className="mb-10 font-poster uppercase tracking-wide text-5xl text-white">{title}</h1>
      <div className="space-y-5 text-[15px] leading-7 text-ash-300 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ash-100">{children}</div>
    </article>
  );
}

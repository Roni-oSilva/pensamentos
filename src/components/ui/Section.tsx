import Link from "next/link";

export function Section({ eyebrow, title, href, hrefLabel = "Ver tudo →", children }: { eyebrow?: string; title: string; href?: string; hrefLabel?: string; children: React.ReactNode }) {
  return (
    <section className="container-wide mt-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h2 className="font-poster uppercase tracking-wide text-4xl text-white sm:text-5xl">{title}</h2>
        </div>
        {href && <Link href={href} className="link-muted shrink-0 text-sm">{hrefLabel}</Link>}
      </div>
      {children}
    </section>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="container-wide pt-14">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="font-poster uppercase tracking-wide text-5xl leading-none text-white sm:text-6xl">{title}</h1>
      {children && <div className="mt-4 max-w-2xl text-ash-300">{children}</div>}
    </div>
  );
}

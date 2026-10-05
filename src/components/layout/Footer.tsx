import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-700">
      <div className="container-wide flex flex-col gap-6 py-10 text-sm text-ash-400 md:flex-row md:items-center md:justify-between">
        <p className="font-display text-base italic text-ash-300">“Posso todas as coisas em Cristo que me fortalece.” <span className="not-italic text-ash-400">Filipenses 4:13</span></p>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link className="link-muted" href="/privacidade">Privacidade</Link>
          <Link className="link-muted" href="/termos">Termos de uso</Link>
          <Link className="link-muted" href="/diretrizes">Diretrizes da comunidade</Link>
        </nav>
        <p>© {new Date().getFullYear()} <span className="church-name text-lg text-ash-200">Igreja de Cristo</span></p>
      </div>
    </footer>
  );
}

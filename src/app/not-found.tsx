import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-narrow flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
      <p className="eyebrow">404</p>
      <h1 className="font-poster uppercase tracking-wide text-5xl text-white">Esta heresia não existe.</h1>
      <p className="text-ash-400">A página foi removida, nunca existiu ou você não tem acesso.</p>
      <Link href="/" className="btn-primary">Voltar ao início</Link>
    </div>
  );
}

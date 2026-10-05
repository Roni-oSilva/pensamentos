"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Nunca exibimos a mensagem original: pode conter detalhes internos.
  return (
    <div className="container-narrow flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
      <h1 className="font-poster uppercase tracking-wide text-5xl text-white">Algo se quebrou.</h1>
      <p className="text-ash-400">Houve um erro inesperado. Tente novamente em instantes.</p>
      <button className="btn-primary" onClick={reset}>Tentar de novo</button>
    </div>
  );
}

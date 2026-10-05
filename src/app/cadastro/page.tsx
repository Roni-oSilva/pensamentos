import { SignupForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Criar conta", robots: { index: false } };

export default function SignupPage() {
  return (
    <div className="container-narrow flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <h1 className="mb-8 font-poster uppercase tracking-wide text-5xl text-white">Criar conta</h1>
      <details className="group mb-8 rounded-xl border border-ink-600 bg-ink-900/70 open:border-poster/60">
        <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm text-ash-100 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-poster text-ink-950" aria-hidden>▶</span>Ver como criar a conta (22 segundos)</span>
          <span className="text-ash-400 transition-transform group-open:rotate-180" aria-hidden>⌄</span>
        </summary>
        <div className="px-4 pb-4">
          <video controls playsInline preload="none" poster="/divulgacao/tutorial-poster.jpg" className="mx-auto max-h-[70vh] w-full max-w-[18rem] rounded-lg bg-black">
            <source src="/divulgacao/tutorial-criar-conta.mp4" type="video/mp4" />
            Seu navegador não reproduz vídeo. Preencha usuário, e-mail e senha abaixo e confirme pelo link enviado ao seu e-mail.
          </video>
        </div>
      </details>
      <SignupForm />
    </div>
  );
}

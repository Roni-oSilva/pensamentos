import { ResetRequestForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Recuperar senha", robots: { index: false } };

export default function ResetPage() {
  return (
    <div className="container-narrow flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <h1 className="mb-3 font-display text-5xl text-white">Recuperar senha</h1>
      <p className="mb-8 text-ash-400">Informe o e-mail da conta. Se existir, enviaremos um link.</p>
      <ResetRequestForm />
    </div>
  );
}

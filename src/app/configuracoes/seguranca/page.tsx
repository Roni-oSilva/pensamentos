import { requireUser } from "@/lib/auth";
import { MfaEnroll } from "@/components/auth/MfaPanel";
import { PageTitle } from "@/components/ui/Section";

export const metadata = { title: "Segurança da conta", robots: { index: false } };

export default async function Seguranca({ searchParams }: { searchParams: Promise<{ required?: string }> }) {
  await requireUser("/configuracoes/seguranca");
  const required = (await searchParams).required === "1";
  return (
    <>
      <PageTitle eyebrow="Conta" title="Autenticação em duas etapas" />
      <div className="container-narrow mt-10 space-y-6">
        {required && <p role="alert" className="rounded-md border border-blood/60 bg-blood/10 px-4 py-3 text-sm text-red-200">O painel administrativo exige 2FA. Ative-o para continuar.</p>}
        <MfaEnroll redirectTo={required ? "/admin" : undefined} />
      </div>
    </>
  );
}

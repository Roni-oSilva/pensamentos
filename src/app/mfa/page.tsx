import { requireUser } from "@/lib/auth";
import { MfaChallenge } from "@/components/auth/MfaPanel";
import { safeRedirect } from "@/lib/utils";

export const metadata = { title: "Verificação em duas etapas", robots: { index: false } };

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeRedirect((await searchParams).next, "/admin");
  await requireUser("/mfa");
  return (
    <div className="container-narrow flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <h1 className="mb-3 font-display text-5xl text-white">Verificação</h1>
      <p className="mb-8 text-ash-400">Confirme sua identidade com o código do app autenticador.</p>
      <MfaChallenge next={next} />
    </div>
  );
}

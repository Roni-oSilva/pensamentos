import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/auth/AuthForms";
import { safeRedirect } from "@/lib/utils";

export const metadata = { title: "Entrar", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; erro?: string }> }) {
  const sp = await searchParams;
  const next = safeRedirect(sp.next);
  if (await getSession()) redirect(next);
  return (
    <div className="container-narrow flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <h1 className="mb-8 font-display text-5xl text-white">Entrar</h1>
      {sp.erro && <p role="alert" className="mb-6 rounded-md border border-blood/60 bg-blood/10 px-3 py-2 text-sm text-red-200">O link é inválido ou expirou. Tente novamente.</p>}
      <LoginForm next={next} />
    </div>
  );
}

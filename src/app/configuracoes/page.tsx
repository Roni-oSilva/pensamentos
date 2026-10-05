import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { DeleteAccountForm, PasswordForm, ProfileForm } from "@/components/profile/SettingsForms";
import { PageTitle } from "@/components/ui/Section";

export const metadata = { title: "Configurações", robots: { index: false } };

export default async function Configuracoes() {
  const s = await requireUser("/configuracoes");
  return (
    <>
      <PageTitle eyebrow="Conta" title="Configurações" />
      <div className="container-narrow mt-10 space-y-14">
        <section aria-labelledby="perfil-h"><h2 id="perfil-h" className="mb-5 font-poster uppercase tracking-wide text-3xl text-white">Perfil público</h2><ProfileForm profile={s.profile} /></section>
        <section aria-labelledby="senha-h"><h2 id="senha-h" className="mb-5 font-poster uppercase tracking-wide text-3xl text-white">Senha</h2><PasswordForm /></section>
        <section aria-labelledby="seg-h"><h2 id="seg-h" className="mb-3 font-poster uppercase tracking-wide text-3xl text-white">Segurança</h2>
          <p className="mb-4 text-sm text-ash-400">Proteja a conta com autenticação em duas etapas (obrigatória para administradores).</p>
          <Link href="/configuracoes/seguranca" className="btn-ghost">Gerenciar 2FA</Link></section>
        <section aria-labelledby="priv-h"><h2 id="priv-h" className="mb-3 font-poster uppercase tracking-wide text-3xl text-white">Privacidade e dados</h2>
          <p className="mb-5 text-sm text-ash-400">Seu e-mail nunca aparece publicamente. Veja a <Link className="link-muted" href="/privacidade">Política de Privacidade</Link>.</p>
          <DeleteAccountForm username={s.profile.username} /></section>
      </div>
    </>
  );
}

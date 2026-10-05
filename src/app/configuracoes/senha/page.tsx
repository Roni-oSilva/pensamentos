import { requireUser } from "@/lib/auth";
import { PasswordForm } from "@/components/profile/SettingsForms";
import { PageTitle } from "@/components/ui/Section";

export const metadata = { title: "Nova senha", robots: { index: false } };

/** Destino do link de recuperação: a sessão já foi criada por /auth/callback. */
export default async function NewPassword() {
  await requireUser("/configuracoes/senha");
  return (
    <>
      <PageTitle eyebrow="Recuperação" title="Definir nova senha" />
      <div className="container-narrow mt-10 max-w-md"><PasswordForm recovery /></div>
    </>
  );
}

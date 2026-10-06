"use client";
import { useActionState } from "react";
import { changePassword, deleteAccount } from "@/actions/auth";
import { updateProfile } from "@/actions/profile";
import { AvatarCropField } from "./AvatarCropField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfile, {});
  return (
    <form action={action} className="space-y-5">
      <AvatarCropField currentUrl={profile.avatar_url} />
      <div><label className="label" htmlFor="username">Nome de usuário</label><input id="username" name="username" defaultValue={profile.username} required pattern="[A-Za-z0-9_]{3,24}" className="field" /></div>
      <div><label className="label" htmlFor="displayName">Nome de exibição</label><input id="displayName" name="displayName" defaultValue={profile.display_name ?? ""} required maxLength={50} className="field" /></div>
      <div><label className="label" htmlFor="bio">Bio</label><textarea id="bio" name="bio" rows={3} maxLength={280} defaultValue={profile.bio ?? ""} className="field" /></div>
      <FormMessage state={state} />
      <SubmitButton>Salvar perfil</SubmitButton>
    </form>
  );
}

export function PasswordForm({ recovery = false }: { recovery?: boolean }) {
  const [state, action] = useActionState(changePassword, {});
  return (
    <form action={action} className="space-y-5">
      {recovery && <input type="hidden" name="recovery" value="1" />}
      {!recovery && <div><label className="label" htmlFor="current">Senha atual</label><input id="current" name="current" type="password" autoComplete="current-password" required className="field" /></div>}
      <div><label className="label" htmlFor="password">Nova senha</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={72} className="field" /></div>
      <div><label className="label" htmlFor="confirm">Confirmar nova senha</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field" /></div>
      <FormMessage state={state} />
      <SubmitButton>Alterar senha</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm({ username }: { username: string }) {
  const [state, action] = useActionState(deleteAccount, {});
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-ash-300">Exclui definitivamente sua conta, perfil, publicações, comentários, curtidas e favoritos. Não há como desfazer.</p>
      <div><label className="label" htmlFor="confirm">Digite <strong>{username}</strong> para confirmar</label><input id="confirm" name="confirm" required autoComplete="off" className="field" /></div>
      <div><label className="label" htmlFor="del-password">Sua senha</label><input id="del-password" name="password" type="password" autoComplete="current-password" required className="field" /></div>
      <FormMessage state={state} />
      <ConfirmButton title="Excluir conta definitivamente?" message="Todos os seus dados serão apagados. Esta ação é irreversível." confirmLabel="Excluir minha conta">Excluir minha conta</ConfirmButton>
    </form>
  );
}

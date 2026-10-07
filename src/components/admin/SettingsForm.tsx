"use client";
import { useActionState } from "react";
import { updateSettings } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";

export function SettingsForm({ registrationsOpen, communityOpen, autopublish }: { registrationsOpen: boolean; communityOpen: boolean; autopublish: boolean }) {
  const [state, action] = useActionState(updateSettings, {});
  return (
    <form action={action} className="max-w-lg space-y-5">
      <label className="flex items-center gap-3"><input type="checkbox" name="registrations_open" defaultChecked={registrationsOpen} className="accent-white" /> Novos cadastros abertos</label>
      <label className="flex items-center gap-3"><input type="checkbox" name="community_open" defaultChecked={communityOpen} className="accent-white" /> Comunidade aceitando novas publicações</label>
      <label className="flex items-start gap-3"><input type="checkbox" name="community_autopublish" defaultChecked={autopublish} className="accent-white mt-1" /> <span>Publicação direta na comunidade<span className="block text-xs text-ash-400">Ligado: o que o membro publica aparece na hora (a equipe modera depois, ocultando o que for impróprio). Desligado: toda publicação espera aprovação.</span></span></label>
      <FormMessage state={state} />
      <SubmitButton>Salvar</SubmitButton>
    </form>
  );
}

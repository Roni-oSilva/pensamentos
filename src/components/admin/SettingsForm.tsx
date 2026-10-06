"use client";
import { useActionState } from "react";
import { updateSettings } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";

export function SettingsForm({ registrationsOpen, communityOpen }: { registrationsOpen: boolean; communityOpen: boolean }) {
  const [state, action] = useActionState(updateSettings, {});
  return (
    <form action={action} className="max-w-lg space-y-5">
      <label className="flex items-center gap-3"><input type="checkbox" name="registrations_open" defaultChecked={registrationsOpen} className="accent-white" /> Novos cadastros abertos</label>
      <label className="flex items-center gap-3"><input type="checkbox" name="community_open" defaultChecked={communityOpen} className="accent-white" /> Comunidade aceitando novas publicações</label>
      <p className="text-xs text-ash-400">Toda publicação da comunidade continua passando por moderação, independentemente destas opções.</p>
      <FormMessage state={state} />
      <SubmitButton>Salvar</SubmitButton>
    </form>
  );
}

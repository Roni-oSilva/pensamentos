"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import type { FormState } from "@/actions/_shared";

export function NameForm({ action, label, withDescription = false }: { action: (s: FormState, fd: FormData) => Promise<FormState>; label: string; withDescription?: boolean }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="mb-8 flex flex-wrap items-end gap-3">
      <div className="min-w-[12rem] flex-1"><label className="label" htmlFor="name">{label}</label><input id="name" name="name" required minLength={2} maxLength={40} className="field" /></div>
      {withDescription && <div className="min-w-[12rem] flex-1"><label className="label" htmlFor="description">Descrição</label><input id="description" name="description" maxLength={200} className="field" /></div>}
      <SubmitButton>Adicionar</SubmitButton>
      <div className="w-full"><FormMessage state={state} /></div>
    </form>
  );
}

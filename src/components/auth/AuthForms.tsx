"use client";
import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, signUp } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";
import type { FormState } from "@/actions/_shared";

const empty: FormState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, empty);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div><label className="label" htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" required className="field" /></div>
      <div><label className="label" htmlFor="password">Senha</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={72} className="field" /></div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Entrando…">Entrar</SubmitButton>
      <p className="text-center text-sm text-ash-400">
        <Link className="link-muted" href="/recuperar-senha">Esqueci minha senha</Link> · <Link className="link-muted" href="/cadastro">Criar conta</Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signUp, empty);
  if (state.success) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-5">
      <div><label className="label" htmlFor="username">Nome de usuário</label><input id="username" name="username" autoComplete="username" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" className="field" placeholder="ex.: herege_noturno" /></div>
      <div><label className="label" htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" required className="field" /><p className="mt-1 text-xs text-ash-400">Nunca é exibido publicamente.</p></div>
      <div><label className="label" htmlFor="password">Senha</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={72} className="field" /><p className="mt-1 text-xs text-ash-400">Mínimo de 10 caracteres, com letras e números.</p></div>
      <label className="flex items-start gap-3 text-sm text-ash-300">
        <input type="checkbox" name="accept" required className="mt-1 accent-white" />
        <span>Li e aceito os <Link className="link-muted" href="/termos" target="_blank">Termos</Link>, a <Link className="link-muted" href="/privacidade" target="_blank">Política de Privacidade</Link> e as <Link className="link-muted" href="/diretrizes" target="_blank">Diretrizes</Link>.</span>
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Criando…">Criar conta</SubmitButton>
      <p className="text-center text-sm text-ash-400">Já tem conta? <Link className="link-muted" href="/login">Entrar</Link></p>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action] = useActionState(requestPasswordReset, empty);
  return (
    <form action={action} className="space-y-5">
      <div><label className="label" htmlFor="email">E-mail da conta</label><input id="email" name="email" type="email" autoComplete="email" required className="field" /></div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full">Enviar link de recuperação</SubmitButton>
    </form>
  );
}

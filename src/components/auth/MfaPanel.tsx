"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

/** Cadastro e desafio de TOTP (2FA) pelo Supabase Auth MFA. O segredo nunca passa pelo nosso servidor. */
export function MfaEnroll({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [factors, setFactors] = useState<{ id: string; status: string }[]>([]);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp ?? []).map((f) => ({ id: f.id, status: f.status })));
  };
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    setMsg(null);
    // remove tentativas não verificadas
    for (const f of factors.filter((f) => f.status !== "verified")) await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `app-${Date.now()}` });
    if (error || !data) return setMsg("Não foi possível iniciar o cadastro.");
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }
  async function verify() {
    if (!enroll) return;
    const ch = await supabase.auth.mfa.challenge({ factorId: enroll.id });
    if (ch.error) return setMsg("Falha ao gerar desafio.");
    const v = await supabase.auth.mfa.verify({ factorId: enroll.id, challengeId: ch.data.id, code });
    if (v.error) return setMsg("Código inválido. Use o código atual do app (muda a cada 30 segundos).");
    setEnroll(null); setCode(""); setMsg("Autenticação em duas etapas ativada."); await load();
    await supabase.auth.refreshSession();
    if (redirectTo) { setMsg("Autenticação ativada. Abrindo o painel…"); router.replace(redirectTo); router.refresh(); }
  }
  async function disable(id: string) {
    if (!window.confirm("Desativar a autenticação em duas etapas?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    setMsg(error ? "Para desativar, conclua o desafio 2FA primeiro (saia e entre novamente)." : "2FA desativado.");
    await load();
  }

  const verified = factors.filter((f) => f.status === "verified");
  return (
    <div className="space-y-4">
      {verified.length > 0 ? (
        <div className="flex items-center justify-between rounded-md border border-ink-600 p-4">
          <p className="text-sm">Autenticação em duas etapas <strong className="text-white">ativa</strong>.</p>
          <button className="btn-ghost" onClick={() => disable(verified[0]!.id)}>Desativar</button>
        </div>
      ) : enroll ? (
        <div className="space-y-4">
          <p className="text-sm text-ash-300">Escaneie o QR code no seu app autenticador (Google Authenticator, Authy, 1Password…) e digite o código de 6 dígitos.</p>
          <Image src={enroll.qr} alt="QR code para o app autenticador" width={180} height={180} unoptimized className="rounded bg-white p-2" />
          <p className="break-all text-xs text-ash-400">Chave manual: <code>{enroll.secret}</code></p>
          <div className="flex gap-2">
            <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="field max-w-40" placeholder="000000" aria-label="Código de 6 dígitos" />
            <button className="btn-primary" onClick={verify} disabled={code.length !== 6}>Verificar</button>
          </div>
        </div>
      ) : (
        <button className="btn-primary" onClick={start}>Ativar autenticação em duas etapas</button>
      )}
      {msg && <p role="status" className="text-sm text-ash-200">{msg}</p>}
    </div>
  );
}

export function MfaChallenge({ next }: { next: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { data: f } = await supabase.auth.mfa.listFactors();
    const factor = f?.totp.find((x) => x.status === "verified");
    if (!factor) return setError("Nenhum fator 2FA cadastrado.");
    const ch = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (ch.error) return setError("Falha ao gerar desafio.");
    const v = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: ch.data.id, code });
    if (v.error) return setError("Código inválido.");
    router.replace(next); router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="label" htmlFor="code">Código do app autenticador</label>
      <input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="field" />
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button className="btn-primary w-full" disabled={code.length !== 6}>Confirmar</button>
    </form>
  );
}

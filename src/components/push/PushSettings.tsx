"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { getPushPrefs, removePushSubscription, savePushSubscription, updatePushPrefs, type PushPrefs } from "@/actions/push";
import { currentSubscription, pushSupport, subscribe, type PushSupport } from "@/lib/push-client";
import { toast } from "@/lib/toast";

type State = "loading" | PushSupport | "denied" | "idle" | "on";

/** Cartão de notificações: ativar neste aparelho e escolher o que apita (Momentos e publicações da comunidade). */
export function PushSettings({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [sub, setSub] = useState<PushSubscription | null>(null);
  const [prefs, setPrefs] = useState<PushPrefs>({ instants: true, posts: true });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const sup = pushSupport();
      if (sup !== "ok") return setState(sup);
      if (Notification.permission === "denied") return setState("denied");
      const s = await currentSubscription();
      if (!s) return setState("idle");
      const saved = await getPushPrefs(s.endpoint);
      if (!saved) { // inscrito no aparelho mas não no servidor (outra conta, banco limpo): registra de novo
        const r = await savePushSubscription(s.toJSON());
        if (!r.ok) return setState("idle");
      } else setPrefs(saved);
      setSub(s); setState("on");
    })();
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const s = await subscribe();
      if (s === "denied") { setState("denied"); return; }
      if (!s) return;
      const r = await savePushSubscription(s.toJSON(), prefs);
      if (!r.ok) { toast(r.error); return; }
      setSub(s); setState("on"); toast("Notificações ativadas! 🔔");
    } catch { toast("Não foi possível ativar neste aparelho."); }
    finally { setBusy(false); }
  }
  async function disable() {
    if (!sub) return;
    setBusy(true);
    await removePushSubscription(sub.endpoint);
    await sub.unsubscribe().catch(() => undefined);
    setSub(null); setState("idle"); setBusy(false);
    toast("Notificações desativadas neste aparelho.");
  }
  async function toggle(k: keyof PushPrefs) {
    if (!sub) return;
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next);
    const r = await updatePushPrefs(sub.endpoint, next);
    if (!r.ok) { setPrefs(prefs); toast(r.error); }
  }

  if (state === "loading" || state === "off") return null;
  const box = `card ${compact ? "p-4" : "p-5 sm:p-6"}`;
  if (state === "unsupported") return null;
  if (state === "needs-install") return (
    <div className={box}><p className="flex items-center gap-2 font-semibold text-white"><Bell className="h-5 w-5" /> Notificações</p>
      <p className="mt-1 text-sm text-ash-300">No iPhone, as notificações funcionam com o app instalado: no Safari, toque em Compartilhar → Adicionar à Tela de Início, e abra pelo ícone.</p></div>
  );
  if (state === "denied") return (
    <div className={box}><p className="flex items-center gap-2 font-semibold text-white"><BellOff className="h-5 w-5" /> Notificações bloqueadas</p>
      <p className="mt-1 text-sm text-ash-300">Você bloqueou as notificações deste app. Para receber, libere nas configurações do celular (Notificações → Igreja de Cristo) e volte aqui.</p></div>
  );
  if (state === "idle") return (
    <div className={`${box} flex flex-wrap items-center justify-between gap-4`}>
      <div className="min-w-0"><p className="flex items-center gap-2 font-semibold text-white"><Bell className="h-5 w-5" /> Notificações</p>
        <p className="mt-1 text-sm text-ash-300">Receba um aviso no celular quando alguém postar um Momento ou publicar na comunidade.</p></div>
      <button type="button" onClick={enable} disabled={busy} className="btn-primary">{busy ? "Ativando…" : "Ativar notificações"}</button>
    </div>
  );
  return (
    <div className={box}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold text-white"><BellRing className="h-5 w-5 text-amber-300" /> Notificações ativadas</p>
        <button type="button" onClick={disable} disabled={busy} className="text-xs text-ash-400 underline-offset-2 hover:underline">Desativar</button>
      </div>
      <div className="mt-3 space-y-2">
        {([["instants", "Quando alguém postar um Momento"], ["posts", "Quando alguém publicar na comunidade"]] as const).map(([k, label]) => (
          <label key={k} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-ink-700 px-4 py-3 text-sm text-ash-200">
            {label}
            <input type="checkbox" checked={prefs[k]} onChange={() => toggle(k)} className="h-5 w-5 accent-[#e1251b]" />
          </label>
        ))}
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, RefreshCw, SwitchCamera, X } from "lucide-react";
import { sendInstant } from "@/actions/instants";
import { toast } from "@/lib/toast";

type Mode = "starting" | "live" | "preview" | "fallback";
const OUT_W = 1080, OUT_H = 1440; // 3:4, retrato

/** Desenha a imagem recortada em 3:4 (centro) num canvas novo; espelha a câmera frontal, como a pessoa se vê. */
function toCanvas(src: CanvasImageSource, sw: number, sh: number, mirror: boolean): HTMLCanvasElement {
  const c = document.createElement("canvas"); c.width = OUT_W; c.height = OUT_H;
  const ctx = c.getContext("2d")!;
  const target = OUT_W / OUT_H;
  let cw = sw, ch = sh;
  if (sw / sh > target) cw = sh * target; else ch = sw / target;
  const cx = (sw - cw) / 2, cy = (sh - ch) / 2;
  if (mirror) { ctx.translate(OUT_W, 0); ctx.scale(-1, 1); }
  ctx.drawImage(src, cx, cy, cw, ch, 0, 0, OUT_W, OUT_H);
  return c;
}
// o canvas gera um JPEG novo: sem localização nem outros metadados da câmera
const toJpeg = (c: HTMLCanvasElement) => new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.86));

export function InstantCamera({ friends }: { friends: number }) {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<Mode>("starting");
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(false);

  const stop = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; };

  const start = useCallback(async (f: "user" | "environment") => {
    stop();
    setMode("starting");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("sem câmera");
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: f, width: { ideal: 1440 }, height: { ideal: 1920 } }, audio: false });
      stream.current = st;
      if (video.current) { video.current.srcObject = st; await video.current.play().catch(() => undefined); }
      setMode("live");
    } catch {
      setMode("fallback"); // sem permissão ou sem suporte: usa a câmera do sistema
    }
  }, []);

  useEffect(() => { start("environment"); return stop; }, [start]);
  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url); }, [shot]);

  async function capture() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    setFlash(true); setTimeout(() => setFlash(false), 180);
    navigator.vibrate?.(15);
    const blob = await toJpeg(toCanvas(v, v.videoWidth, v.videoHeight, facing === "user"));
    if (!blob) return;
    setShot({ blob, url: URL.createObjectURL(blob) });
    setMode("preview");
    v.pause();
  }

  async function fromSystemCamera(file: File | undefined) {
    if (!file) return;
    try {
      const bmp = await createImageBitmap(file); // já respeita a orientação da foto
      const blob = await toJpeg(toCanvas(bmp, bmp.width, bmp.height, false));
      bmp.close();
      if (!blob) throw new Error("foto");
      setShot({ blob, url: URL.createObjectURL(blob) });
      setMode("preview");
    } catch { toast("Não foi possível usar essa foto. Tente de novo."); }
  }

  function retake() {
    setShot(null); setCaption("");
    if (stream.current && video.current) { video.current.play().catch(() => undefined); setMode("live"); } else start(facing);
  }

  function flip() {
    const f = facing === "user" ? "environment" : "user";
    setFacing(f); start(f);
  }

  async function send() {
    if (!shot || sending) return;
    setSending(true);
    const fd = new FormData();
    fd.append("photo", shot.blob, "instante.jpg");
    if (caption.trim()) fd.append("caption", caption.trim());
    const r = await sendInstant(fd);
    setSending(false);
    if (!r.ok) { toast(r.error); return; }
    stop();
    toast(friends ? `Instante enviado para ${friends} ${friends === 1 ? "amigo" : "amigos"}!` : "Instante enviado!");
    router.push("/instantes");
    router.refresh();
  }

  return (
    <div className="instant-stage force-dark fixed inset-0 z-[70] flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/instantes" aria-label="Fechar" className="grid h-11 w-11 place-items-center rounded-full bg-white/10" onClick={stop}><X className="h-5 w-5" /></Link>
        <p className="text-sm font-semibold tracking-wide">Instante</p>
        <span className="w-11" />
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-1 items-center px-3">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] bg-neutral-900">
          <video ref={video} playsInline muted className={`h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""} ${mode === "preview" ? "hidden" : ""}`} />
          {shot && mode === "preview" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot.url} alt="Sua foto" className="instant-pop absolute inset-0 h-full w-full object-cover" />
          )}
          {mode === "starting" && <p className="absolute inset-0 grid place-items-center text-sm text-white/60">Abrindo a câmera…</p>}
          {mode === "fallback" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="text-lg font-semibold">Use a câmera do celular</p>
              <p className="text-sm text-white/60">Permita o acesso à câmera ou toque abaixo para tirar a foto agora.</p>
              <label className="cursor-pointer rounded-full bg-white px-6 py-3 font-semibold text-black">
                Abrir câmera
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => fromSystemCamera(e.target.files?.[0])} />
              </label>
            </div>
          )}
          {flash && <div className="absolute inset-0 bg-white/80" />}
          {mode === "preview" && (
            <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={80} placeholder="Adicione uma legenda…" aria-label="Legenda"
              className="absolute inset-x-4 bottom-4 rounded-full bg-black/55 px-5 py-3 text-center text-[15px] text-white placeholder:text-white/60 backdrop-blur focus:outline-none" />
          )}
        </div>
      </div>

      <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
        {mode === "preview" ? (
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <button type="button" onClick={retake} className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-3.5 font-semibold"><RefreshCw className="h-4 w-4" /> Refazer</button>
            <button type="button" onClick={send} disabled={sending} className="flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-bold text-black disabled:opacity-60">
              {sending ? "Enviando…" : "Enviar"} <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="mx-auto flex max-w-md items-center justify-between">
            <span className="w-12" />
            <button type="button" onClick={capture} disabled={mode !== "live"} aria-label="Tirar foto"
              className="grid h-[78px] w-[78px] place-items-center rounded-full border-[5px] border-white transition active:scale-90 disabled:opacity-40">
              <span className="h-[60px] w-[60px] rounded-full bg-white" />
            </button>
            <button type="button" onClick={flip} disabled={mode === "fallback"} aria-label="Trocar câmera" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 disabled:opacity-30"><SwitchCamera className="h-5 w-5" /></button>
          </div>
        )}
        <p className="mt-4 text-center text-xs text-white/55">
          {friends ? `Vai para ${friends} ${friends === 1 ? "amigo" : "amigos"} (quem você segue e te segue) · some depois de visto` : "Você ainda não tem amigos: siga irmãos que também te seguem para eles receberem."}
        </p>
      </div>
    </div>
  );
}

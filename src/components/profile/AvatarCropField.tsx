"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const VIEW = 300;     // tamanho exibido do recorte (px)
const S = 600;        // resolução interna do recorte (nítido em telas retina)
const OUT = 512;      // tamanho final da foto enviada

/**
 * Escolher e AJUSTAR a foto de perfil: arrastar para posicionar, zoom e girar, num recorte redondo.
 * O resultado (512×512) entra no formulário como o arquivo `avatar`, e o servidor valida do mesmo jeito de sempre.
 */
export function AvatarCropField({ currentUrl, name = "avatar" }: { currentUrl?: string | null; name?: string }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [bmp, setBmp] = useState<ImageBitmap | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const dims = useCallback(() => {
    if (!bmp) return null;
    const swap = rot % 2 === 1;
    const rw = swap ? bmp.height : bmp.width, rh = swap ? bmp.width : bmp.height;
    const min = Math.max(S / rw, S / rh);
    return { rw, rh, scale: min * zoom };
  }, [bmp, rot, zoom]);

  const clamp = useCallback((x: number, y: number) => {
    const d = dims(); if (!d) return { x: 0, y: 0 };
    const mx = Math.max(0, (d.rw * d.scale - S) / 2), my = Math.max(0, (d.rh * d.scale - S) / 2);
    return { x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
  }, [dims]);

  const paint = useCallback((cv: HTMLCanvasElement, size: number) => {
    const d = dims(); const ctx = cv.getContext("2d");
    if (!d || !bmp || !ctx) return;
    const k = size / S;
    cv.width = size; cv.height = size;
    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.translate((S / 2 + pos.x) * k, (S / 2 + pos.y) * k);
    ctx.rotate((rot * Math.PI) / 2);
    ctx.scale(d.scale * k, d.scale * k);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
    ctx.restore();
  }, [bmp, dims, pos, rot]);

  useEffect(() => { if (canvas.current && bmp) paint(canvas.current, S); }, [bmp, paint]);
  useEffect(() => { setPos((p) => clamp(p.x, p.y)); }, [zoom, rot, clamp]);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setError("Use uma imagem JPG, PNG ou WebP."); return; }
    try {
      const b = await createImageBitmap(file, { imageOrientation: "from-image" }); // respeita a rotação do celular
      setBmp(b); setZoom(1); setRot(0); setPos({ x: 0, y: 0 });
      dlg.current?.showModal();
    } catch { setError("Não foi possível abrir essa imagem."); }
  }

  const onDown = (e: React.PointerEvent) => { (e.target as Element).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y }; };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const f = S / VIEW;
    setPos(clamp(drag.current.ox + (e.clientX - drag.current.x) * f, drag.current.oy + (e.clientY - drag.current.y) * f));
  };
  const onUp = () => { drag.current = null; };

  function confirm() {
    const out = document.createElement("canvas");
    paint(out, OUT);
    out.toBlob((blob) => {
      if (!blob || !hidden.current) return setError("Não foi possível preparar a foto.");
      const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/jpeg" ? "jpg" : "png";
      const file = new File([blob], `avatar.${ext}`, { type: blob.type });
      const dt = new DataTransfer(); dt.items.add(file);
      hidden.current.files = dt.files;
      setPreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob); });
      dlg.current?.close();
    }, "image/webp", 0.9);
  }
  function cancel() { dlg.current?.close(); if (picker.current) picker.current.value = ""; }
  function remove() { if (hidden.current) hidden.current.value = ""; if (picker.current) picker.current.value = ""; setPreview(null); }

  const shown = preview ?? currentUrl ?? null;
  return (
    <div className="flex items-center gap-4">
      {shown
        ? <Image src={shown} alt="Foto de perfil" width={80} height={80} unoptimized={!!preview} className="h-20 w-20 shrink-0 rounded-full border-2 border-poster/60 object-cover" />
        : <span aria-hidden className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-dashed border-ink-500 text-2xl text-ash-400">✝</span>}
      <div className="min-w-0 flex-1 space-y-2">
        <span className="label">Foto de perfil</span>
        <div className="flex flex-wrap gap-2">
          <label className="btn-ghost cursor-pointer">Escolher e ajustar foto
            <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void onPick(e.target.files?.[0])} />
          </label>
          {preview && <button type="button" className="btn-ghost" onClick={remove}>Desfazer</button>}
        </div>
        {preview && <p className="text-xs text-ash-300">Nova foto pronta. Toque em <strong>Salvar perfil</strong> para aplicar.</p>}
        {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      </div>
      {/* arquivo final que segue no formulário */}
      <input ref={hidden} type="file" name={name} className="sr-only" tabIndex={-1} aria-hidden />

      <dialog ref={dlg} aria-labelledby="crop-title" onCancel={cancel} className="w-[min(94vw,26rem)] rounded-xl border border-ink-600 bg-ink-900 p-0 text-ash-200 backdrop:bg-black/80">
        <div className="space-y-4 p-5">
          <div><h3 id="crop-title" className="font-poster text-2xl uppercase tracking-wide text-white">Ajustar foto</h3>
            <p className="text-xs text-ash-400">Arraste para posicionar. Use o zoom para aproximar.</p></div>
          <div className="relative mx-auto touch-none select-none overflow-hidden rounded-xl bg-black" style={{ width: VIEW, height: VIEW, maxWidth: "100%" }}>
            <canvas ref={canvas} width={S} height={S} className="h-full w-full cursor-grab active:cursor-grabbing" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
              onWheel={(e) => setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.002)))} />
            {/* máscara redonda: escurece fora do círculo */}
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at center, transparent 0 46%, rgba(0,0,0,.62) 46.5%)" }} />
            <div aria-hidden className="pointer-events-none absolute inset-[4%] rounded-full border border-white/50" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ash-400">−</span>
            <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom" className="h-10 flex-1 accent-[#e8453c]" />
            <span className="text-xs text-ash-400">+</span>
            <button type="button" className="btn-ghost px-3" onClick={() => setRot((r) => (r + 1) % 4)} aria-label="Girar 90 graus">⟳</button>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={cancel}>Cancelar</button>
            <button type="button" className="btn-primary" onClick={confirm}>Usar esta foto</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

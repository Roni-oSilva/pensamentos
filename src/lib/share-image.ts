/** Gera o PNG de compartilhamento no navegador (canvas): imagem de fundo à escolha, a frase e SEMPRE a marca "Igreja de Cristo". */

import { MARK_BODY, MARK_TRAIL, MARK_VIEWBOX } from "@/lib/church-mark";

const W = 1080, H = 1350;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

/** Reduz a fonte até o texto caber na caixa. */
function fit(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, box: { w: number; h: number }, max: number, min: number, lh: number) {
  for (let px = max; px >= min; px -= 2) {
    ctx.font = font(px);
    const lines = wrap(ctx, text, box.w);
    if (lines.length * px * lh <= box.h) return { px, lines };
  }
  ctx.font = font(min);
  const lines = wrap(ctx, text, box.w);
  const maxLines = Math.floor(box.h / (min * lh));
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = `${(lines[maxLines - 1] ?? "").replace(/\s+\S*$/, "")}…`; }
  return { px: min, lines };
}

/** Fundos disponíveis para o cartão (arquivos em /public/share). `null` = fundo liso escuro. */
export const SHARE_BACKGROUNDS = [
  { id: 1, src: "/share/bg1.webp", label: "Pastor e ovelha" },
  { id: 2, src: "/share/bg2.webp", label: "Ovelha" },
  { id: 3, src: "/share/bg3.webp", label: "Pomba" },
  { id: 4, src: "/share/bg4.webp", label: "Mãos" },
  { id: 5, src: "/share/bg5.webp", label: "Água" },
] as const;

export const SHARE_BRAND = "Igreja de Cristo";

export async function renderShareImage(text: string, bg: number | null = 1, signature?: string): Promise<Blob> {
  await Promise.all([document.fonts.load("900 90px 'Church Condensed'"), document.fonts.load("500 40px 'Inter Variable'")]).catch(() => undefined);
  const bgDef = SHARE_BACKGROUNDS.find((b) => b.id === bg);
  const photo = bgDef ? await loadImage(bgDef.src).catch(() => null) : null;

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  // fundo: foto em "cover" (preenche sem distorcer) ou liso escuro
  ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, W, H);
  if (photo) {
    const k = Math.max(W / photo.width, H / photo.height);
    const dw = photo.width * k, dh = photo.height * k;
    ctx.drawImage(photo, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    const g = ctx.createRadialGradient(W / 2, H * 0.4, 60, W / 2, H * 0.4, 900);
    g.addColorStop(0, "#26201c"); g.addColorStop(1, "#050505");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // escurece para dar leitura (mais forte no meio e embaixo)
  ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(0, 0, W, H);
  const shade = ctx.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, "rgba(0,0,0,0.22)"); shade.addColorStop(0.5, "rgba(0,0,0,0.34)"); shade.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);

  // frase, centralizada
  const clean = text.replace(/\s+\n/g, "\n").trim();
  const box = { w: 820, h: 700 };
  const serif = (px: number) => `italic 500 ${px}px Georgia, 'Times New Roman', serif`;
  const f = fit(ctx, clean, serif, box, 78, 34, 1.32);
  const lh = f.px * 1.32, blockH = f.lines.length * lh;
  const top = 120 + (box.h - blockH) / 2 + 80;
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 4;
  ctx.font = "900 200px 'Church Condensed', Georgia, serif"; ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("“", W / 2, top - 150);
  ctx.font = serif(f.px); ctx.fillStyle = "#f7f3ec";
  f.lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * lh));
  if (signature) {
    ctx.font = "500 28px 'Inter Variable', Arial, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(`— ${signature}`, W / 2, top + blockH + 28);
  }
  ctx.shadowColor = "transparent";

  // marca (sempre presente): a igreja (logo oficial) + nome, embaixo ao centro
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "center";
  {
    const h = 96, k = h / MARK_VIEWBOX.h, w = MARK_VIEWBOX.w * k;
    ctx.save();
    ctx.translate(W / 2 - w / 2, H - 262); ctx.scale(k, k); ctx.translate(-MARK_VIEWBOX.x, -MARK_VIEWBOX.y);
    const beam = ctx.createLinearGradient(0, 0, 52, 0);
    beam.addColorStop(0, "rgba(232,69,60,0)"); beam.addColorStop(0.55, "#f59e0b"); beam.addColorStop(1, "#ffe9a8");
    ctx.fillStyle = beam; ctx.fill(new Path2D(MARK_TRAIL));
    ctx.fillStyle = "#ffffff"; ctx.fill(new Path2D(MARK_BODY), "evenodd");
    ctx.restore();
  }
  // nome na mesma letra do site (didone preta condensada)
  ctx.font = "900 94px 'Church Condensed', Didot, Georgia, serif"; ctx.fillStyle = "#ffffff"; ctx.letterSpacing = "4px";
  ctx.fillText(SHARE_BRAND.toUpperCase(), W / 2 + 2, H - 58);
  ctx.letterSpacing = "0px";

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png"));
}

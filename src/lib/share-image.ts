/** Gera o PNG de compartilhamento no navegador (canvas): mão + borboleta ao fundo, frase e "HERESIAS" no canto. */

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

export async function renderShareImage(text: string, signature?: string): Promise<Blob> {
  await Promise.all([document.fonts.load("100px Anton"), document.fonts.load("500 40px 'Inter Variable'")]).catch(() => undefined);
  const [hand, butterfly] = await Promise.all([loadImage("/hero/hand.webp"), loadImage("/hero/butterfly.webp")]);

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  // fundo
  ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.72, H * 0.62, 40, W * 0.72, H * 0.62, 700);
  glow.addColorStop(0, "rgba(232,69,60,0.35)"); glow.addColorStop(1, "rgba(232,69,60,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // mão (canto inferior direito) + borboleta tocando a ponta do dedo
  const hh = 1020, hw = hh * (hand.width / hand.height), hx = W - hw - 20, hy = H - hh + 40;
  ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24;
  ctx.drawImage(hand, hx, hy, hw, hh);
  const bw = 330, bh = bw * (butterfly.height / butterfly.width);
  ctx.drawImage(butterfly, Math.min(hx + hw * 0.8 - bw / 2, W - 40 - bw), hy - bh + 28, bw, bh);
  ctx.shadowColor = "transparent";

  // escurece à esquerda para dar leitura ao texto
  const fade = ctx.createLinearGradient(0, 0, W * 0.85, 0);
  fade.addColorStop(0, "rgba(5,5,5,0.92)"); fade.addColorStop(0.6, "rgba(5,5,5,0.55)"); fade.addColorStop(1, "rgba(5,5,5,0)");
  ctx.fillStyle = fade; ctx.fillRect(0, 0, W, H);

  // frase
  const clean = text.replace(/\s+\n/g, "\n").trim();
  const short = clean.length <= 140;
  const content = short ? clean.toUpperCase() : clean;
  const box = { w: 540, h: 760 };
  const f = short
    ? fit(ctx, content, (px) => `${px}px Anton, Impact, sans-serif`, box, 96, 46, 1.08)
    : fit(ctx, content, (px) => `500 ${px}px 'Inter Variable', Arial, sans-serif`, box, 46, 24, 1.45);
  ctx.fillStyle = "#f2efe9"; ctx.textBaseline = "top"; ctx.textAlign = "left";
  const lh = f.px * (short ? 1.08 : 1.45);
  const top = 190;
  ctx.font = "160px Anton, Impact, sans-serif"; ctx.fillStyle = "rgba(232,69,60,0.9)"; ctx.fillText("“", 84, 60);
  ctx.font = short ? `${f.px}px Anton, Impact, sans-serif` : `500 ${f.px}px 'Inter Variable', Arial, sans-serif`;
  ctx.fillStyle = "#f2efe9";
  f.lines.forEach((l, i) => ctx.fillText(l, 90, top + i * lh));
  if (signature) {
    ctx.font = "500 26px 'Inter Variable', Arial, sans-serif"; ctx.fillStyle = "#a3a3a3";
    ctx.fillText(`— ${signature}`, 90, top + f.lines.length * lh + 30);
  }

  // marca no canto
  ctx.textBaseline = "alphabetic";
  ctx.font = "78px Anton, Impact, sans-serif"; ctx.fillStyle = "#e8453c"; ctx.letterSpacing = "6px";
  ctx.fillText("HERESIAS", 70, H - 70);
  ctx.letterSpacing = "0px";
  ctx.font = "500 20px 'Inter Variable', Arial, sans-serif"; ctx.fillStyle = "#8a8a8a";
  ctx.fillText("QUE PASSAM PELA MINHA CABEÇA", 74, H - 152);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png"));
}

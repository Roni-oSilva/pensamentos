"use server";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { actionSession } from "@/lib/auth";
import { allow, rateLimitMessage } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { IMAGE_RULES } from "@/lib/constants";
import { detectImageMime } from "@/lib/upload";
import type { Result } from "@/lib/types";
import { FORBIDDEN, GENERIC_ERROR } from "./_shared";

/**
 * Upload direto navegador → Supabase Storage (a Vercel limita o corpo de uma requisição a ~4,5 MB).
 * 1) requestUpload: o servidor valida quem pede, o tamanho e o tipo e emite uma URL assinada de uso único;
 * 2) o navegador envia o arquivo direto ao Storage;
 * 3) finishUpload: o servidor confere o arquivo de verdade (assinatura + tamanho) e só então registra.
 */
const BUCKETS = ["community", "admin"] as const;
type DirectBucket = (typeof BUCKETS)[number];
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

async function session(bucket: string) {
  if (!BUCKETS.includes(bucket as DirectBucket)) return null;
  return actionSession(bucket === "admin" ? "admin" : "user");
}

export async function requestUpload(input: { bucket: string; type: string; size: number }): Promise<Result<{ path: string; token: string }>> {
  const s = await session(input.bucket);
  if (!s) return { ok: false, error: FORBIDDEN };
  if (!(await allow("upload", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const max = IMAGE_RULES[input.bucket as DirectBucket].maxBytes;
  if (!Number.isFinite(input.size) || input.size <= 0) return { ok: false, error: "Arquivo vazio." };
  if (input.size > max) return { ok: false, error: `Arquivo muito grande (máx. ${max / 1024 / 1024} MB).` };
  const ext = EXT[input.type];
  if (!ext) return { ok: false, error: "Formato não permitido. Use JPG, PNG ou WebP." };

  const path = `${s.user.id}/${randomUUID()}.${ext}`;
  const { data, error } = await (await createClient()).storage.from(input.bucket).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: GENERIC_ERROR };
  return { ok: true, path, token: data.token };
}

export async function finishUpload(input: { bucket: string; path: string }): Promise<Result<{ url: string }>> {
  const s = await session(input.bucket);
  if (!s) return { ok: false, error: FORBIDDEN };
  const { bucket, path } = input;
  if (!PATH_RE.test(path) || !path.startsWith(`${s.user.id}/`)) return { ok: false, error: GENERIC_ERROR };

  const supabase = await createClient();
  const reject = async (error: string) => { await supabase.storage.from(bucket).remove([path]); return { ok: false as const, error }; };

  const folder = path.split("/")[0]!, file = path.split("/")[1]!;
  const { data: listed } = await supabase.storage.from(bucket).list(folder, { search: file, limit: 1 });
  const size = Number((listed?.[0]?.metadata as { size?: number } | undefined)?.size ?? 0);
  if (!size) return { ok: false, error: "O envio não foi concluído. Tente de novo." };
  if (size > IMAGE_RULES[bucket as DirectBucket].maxBytes) return reject("Arquivo muito grande.");

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  let head: Uint8Array;
  try {
    const r = await fetch(pub.publicUrl, { headers: { Range: "bytes=0-31" }, cache: "no-store" });
    head = new Uint8Array(await r.arrayBuffer()).slice(0, 32);
  } catch { return reject("Não foi possível verificar o arquivo."); }
  const real = detectImageMime(head);
  if (!real || EXT[real] !== path.split(".").pop()) return reject("O arquivo não é uma imagem válida.");

  await supabase.from("media").insert({ owner_id: s.user.id, bucket, path, mime_type: real, size_bytes: size });
  if (bucket === "admin") await audit("media.upload", "media", path);
  return { ok: true, url: pub.publicUrl };
}

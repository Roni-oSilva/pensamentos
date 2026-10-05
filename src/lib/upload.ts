import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IMAGE_RULES, type Bucket } from "@/lib/constants";
import type { Result } from "@/lib/types";

const MIME_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

/** Confere a assinatura real do arquivo (não confia em Content-Type nem na extensão). */
export function detectImageMime(buf: Uint8Array): string | null {
  const eq = (off: number, bytes: number[]) => bytes.every((b, i) => buf[off + i] === b);
  if (buf.length < 12) return null;
  if (eq(0, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (eq(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (eq(0, [0x52, 0x49, 0x46, 0x46]) && eq(8, [0x57, 0x45, 0x42, 0x50])) return "image/webp";
  return null;
}

/**
 * Valida e envia a imagem usando o cliente DO USUÁRIO — as políticas de Storage
 * (pasta = auth.uid()) continuam valendo. Nome final é gerado pelo servidor.
 */
export async function uploadImage(
  supabase: SupabaseClient, bucket: Bucket, userId: string, file: File,
): Promise<Result<{ url: string; path: string }>> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Selecione uma imagem." };
  if (file.size > IMAGE_RULES[bucket].maxBytes) return { ok: false, error: `Imagem muito grande (máx. ${IMAGE_RULES[bucket].maxBytes / 1024 / 1024} MB).` };
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.has(ext) || !(file.type in MIME_EXT)) return { ok: false, error: "Formato não permitido. Use JPG, PNG ou WebP." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const real = detectImageMime(bytes);
  if (!real || real !== file.type) return { ok: false, error: "O arquivo não é uma imagem válida." };

  const path = `${userId}/${randomUUID()}.${MIME_EXT[real]}`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType: real, upsert: false, cacheControl: "31536000" });
  if (error) return { ok: false, error: "Não foi possível enviar a imagem." };

  await supabase.from("media").insert({ owner_id: userId, bucket, path, mime_type: real, size_bytes: file.size });
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}

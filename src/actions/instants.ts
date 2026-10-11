"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionSession } from "@/lib/auth";
import { allow, rateLimitMessage } from "@/lib/rate-limit";
import { detectImageMime } from "@/lib/upload";
import { idSchema } from "@/lib/validation";
import { INSTANT_ARCHIVE_DAYS, INSTANT_BUCKET, INSTANT_REACTIONS } from "@/lib/instants";
import type { Result } from "@/lib/types";

const MAX_BYTES = 6 * 1024 * 1024;
const NOT_SETUP = "Os Instantes ainda não foram ativados no servidor. O administrador precisa rodar o arquivo RODAR_6_INSTANTES.sql no Supabase.";
const TRY_AGAIN = "Não foi possível enviar agora. Verifique a internet e tente de novo.";
/** O banco/armazenamento ainda não tem os Instantes (SQL não aplicado)? */
const missingSetup = (e: { message?: string; code?: string; statusCode?: string | number } | null | undefined) =>
  !!e && (/bucket not found|does not exist|relation .*instants/i.test(e.message ?? "") || e.code === "42P01" || e.code === "PGRST205" || String(e.statusCode) === "404");

/** Envia um instante: a foto (JPEG/WebP já sem metadados, gerada pelo canvas do app) e uma legenda opcional. */
export async function sendInstant(fd: FormData): Promise<Result<{ id: string }>> {
  const s = await actionSession();
  if (!s) return { ok: false, error: "Entre na sua conta para enviar instantes." };
  if (!(await allow("instant", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const photo = fd.get("photo");
  if (!(photo instanceof Blob) || photo.size === 0) return { ok: false, error: "Tire uma foto primeiro." };
  if (photo.size > MAX_BYTES) return { ok: false, error: "Foto muito grande." };
  const bytes = new Uint8Array(await photo.arrayBuffer());
  const mime = detectImageMime(bytes);
  if (mime !== "image/jpeg" && mime !== "image/webp") return { ok: false, error: "Foto inválida." };
  const caption = String(fd.get("caption") ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || null;

  const id = randomUUID();
  const path = `${s.user.id}/${id}.${mime === "image/webp" ? "webp" : "jpg"}`;
  const admin = createAdminClient();
  const up = await admin.storage.from(INSTANT_BUCKET).upload(path, bytes, { contentType: mime, upsert: false });
  if (up.error) {
    console.error("[instantes] upload falhou:", up.error.message);
    return { ok: false, error: missingSetup(up.error as never) ? NOT_SETUP : TRY_AGAIN };
  }

  // o registro é criado com o cliente da pessoa: as regras do banco (dono, conta ativa, 24 h) continuam valendo
  const supabase = await createClient();
  const { error } = await supabase.from("instants").insert({ id, author_id: s.user.id, path, caption });
  if (error) {
    console.error("[instantes] registro falhou:", error.code, error.message);
    await admin.storage.from(INSTANT_BUCKET).remove([path]);
    return { ok: false, error: missingSetup(error) ? NOT_SETUP : TRY_AGAIN };
  }

  await cleanupOld(s.user.id);
  revalidatePath("/instantes", "layout");
  return { ok: true, id };
}

/** Abre um instante de um amigo (uma única vez) e devolve um link temporário da foto. */
export async function openInstant(id: string): Promise<Result<{ url: string; caption: string | null; createdAt: string }>> {
  const s = await actionSession();
  if (!s || !idSchema.safeParse(id).success) return { ok: false, error: "Instante indisponível." };
  if (!(await allow("instantOpen", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("instant_open", { p_id: id });
  const row = !error && Array.isArray(data) ? (data[0] as { path: string; caption: string | null; created_at: string } | undefined) : undefined;
  if (!row) return { ok: false, error: "Este instante não está mais disponível." };
  const signed = await createAdminClient().storage.from(INSTANT_BUCKET).createSignedUrl(row.path, 120);
  if (!signed.data) return { ok: false, error: "Não foi possível abrir agora." };
  return { ok: true, url: signed.data.signedUrl, caption: row.caption, createdAt: row.created_at };
}

/** Reação a um instante que a pessoa abriu. */
export async function reactInstant(id: string, reaction: string): Promise<Result> {
  const s = await actionSession();
  if (!s || !idSchema.safeParse(id).success || !(INSTANT_REACTIONS as readonly string[]).includes(reaction)) return { ok: false, error: "Reação inválida." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("instant_views").update({ reaction }).eq("instant_id", id).eq("viewer_id", s.user.id).select("instant_id");
  if (error || !data?.length) return { ok: false, error: "Não foi possível reagir." };
  return { ok: true };
}

/** Apaga um instante seu (some para quem ainda não viu e do seu arquivo). */
export async function deleteInstant(id: string): Promise<Result> {
  const s = await actionSession();
  if (!s || !idSchema.safeParse(id).success) return { ok: false, error: "Instante inválido." };
  const supabase = await createClient();
  const { data } = await supabase.from("instants").delete().eq("id", id).eq("author_id", s.user.id).select("path");
  if (!data?.length) return { ok: false, error: "Não foi possível apagar." };
  await createAdminClient().storage.from(INSTANT_BUCKET).remove(data.map((r) => r.path as string));
  revalidatePath("/instantes", "layout");
  return { ok: true };
}

/** Limpeza: instantes da pessoa com mais de 30 dias saem do arquivo (registro e foto). */
async function cleanupOld(userId: string) {
  const admin = createAdminClient();
  const before = new Date(Date.now() - INSTANT_ARCHIVE_DAYS * 86400e3).toISOString();
  const { data } = await admin.from("instants").delete().eq("author_id", userId).lt("created_at", before).select("path");
  if (data?.length) await admin.storage.from(INSTANT_BUCKET).remove(data.map((r) => r.path as string));
}

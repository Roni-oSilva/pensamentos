"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { allow, rateLimitMessage } from "@/lib/rate-limit";
import { firstError, idSchema, nameSchema, officialPostSchema, roleSchema, statusSchema } from "@/lib/validation";
import { isStorageUrl, sanitizeRichHtml } from "@/lib/sanitize";
import { uploadImage } from "@/lib/upload";
import { slugify } from "@/lib/utils";
import type { Result } from "@/lib/types";
import { FORBIDDEN, GENERIC_ERROR, ensureTags, parseTags, setPostTags, str, type FormState } from "./_shared";

type Level = "staff" | "admin";
async function gate(level: Level) {
  const s = await actionSession(level);
  if (!s) return null;
  if (!(await allow("admin", s.user.id))) return null;
  return s;
}

/* ------------------------------ Publicações oficiais ------------------------------ */

export async function saveOfficialPost(_: FormState, fd: FormData): Promise<FormState> {
  const s = await gate("admin");
  if (!s) return { error: FORBIDDEN };
  const supabase = await createClient();
  const editingId = str(fd, "id");
  if (editingId && !idSchema.safeParse(editingId).success) return { error: GENERIC_ERROR };

  const parsed = officialPostSchema.safeParse({
    kind: str(fd, "kind"), title: str(fd, "title"), content: str(fd, "content"),
    categoryId: str(fd, "categoryId") || null, imageUrl: str(fd, "imageUrl") || null,
    tags: parseTags(str(fd, "tags")), status: str(fd, "intent") === "publish" ? "PUBLISHED" : "DRAFT",
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;

  const html = sanitizeRichHtml(d.content);
  if (!html) return { error: "O conteúdo ficou vazio após a sanitização." };
  let imageUrl = d.imageUrl;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    const up = await uploadImage(supabase, "admin", s.user.id, file);
    if (!up.ok) return { error: up.error };
    imageUrl = up.url;
  }
  if (imageUrl && !isStorageUrl(imageUrl, "admin")) return { error: "Imagem inválida." };

  const fields = { kind: d.kind, title: d.title, content: html, category_id: d.categoryId, image_url: imageUrl, status: d.status };
  let id = editingId;
  if (editingId) {
    const { data, error } = await supabase.from("posts").update(fields).eq("id", editingId).eq("origin", "OFFICIAL").select("id");
    if (error || !data?.length) return { error: GENERIC_ERROR };
    await audit(d.status === "PUBLISHED" ? "post.publish" : "post.update", "post", id, { kind: d.kind, status: d.status });
  } else {
    const { data, error } = await supabase.from("posts").insert({ ...fields, author_id: s.user.id, origin: "OFFICIAL" }).select("id").single();
    if (error || !data) return { error: GENERIC_ERROR };
    id = data.id;
    await audit("post.create", "post", id, { kind: d.kind, status: d.status });
  }
  await setPostTags(supabase, id, await ensureTags(d.tags));
  revalidatePath("/frases"); revalidatePath("/");
  redirect(`/admin/posts/${id}/edit?saved=1`);
}

/** Upload de imagem para dentro do editor rico (bucket admin). */
export async function uploadEditorImage(fd: FormData): Promise<Result<{ url: string }>> {
  const s = await gate("admin");
  if (!s) return { ok: false, error: FORBIDDEN };
  if (!(await allow("upload", s.user.id))) return { ok: false, error: rateLimitMessage() };
  const file = fd.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Arquivo ausente." };
  const up = await uploadImage(await createClient(), "admin", s.user.id, file);
  if (!up.ok) return up;
  await audit("media.upload", "media", up.path);
  return { ok: true, url: up.url };
}

/** Moderação de status (publicar, rejeitar, ocultar, despublicar). */
export async function setPostStatus(fd: FormData) {
  const s = await gate("staff");
  const id = idSchema.safeParse(str(fd, "id"));
  const status = statusSchema.safeParse(str(fd, "status"));
  if (!s || !id.success || !status.success) return;
  const reason = str(fd, "reason").slice(0, 300) || null;
  const supabase = await createClient();
  const { data } = await supabase.from("posts")
    .update({ status: status.data, rejection_reason: status.data === "REJECTED" ? reason : null })
    .eq("id", id.data).select("id, origin");
  if (data?.length) await audit(`post.${status.data.toLowerCase()}`, "post", id.data, { origin: data[0]?.origin, reason });
  revalidatePath("/admin", "layout");
}

export async function deletePost(fd: FormData) {
  const s = await gate("admin");
  const id = idSchema.safeParse(str(fd, "id"));
  if (!s || !id.success) return;
  const supabase = await createClient();
  const { data } = await supabase.from("posts").delete().eq("id", id.data).select("id, origin");
  if (data?.length) await audit("post.delete", "post", id.data, { origin: data[0]?.origin });
  revalidatePath("/admin", "layout");
}

/* ------------------------------ Comentários e denúncias ------------------------------ */

export async function moderateComment(fd: FormData) {
  const s = await gate("staff");
  const id = idSchema.safeParse(str(fd, "id"));
  const op = str(fd, "op");
  if (!s || !id.success) return;
  const supabase = await createClient();
  if (op === "delete") await supabase.from("comments").delete().eq("id", id.data);
  else await supabase.from("comments").update({ status: op === "show" ? "VISIBLE" : "HIDDEN" }).eq("id", id.data);
  await audit(`comment.${op}`, "comment", id.data);
  revalidatePath("/admin/comments");
}

export async function resolveReport(fd: FormData) {
  const s = await gate("staff");
  const id = idSchema.safeParse(str(fd, "id"));
  const status = str(fd, "status") === "DISMISSED" ? "DISMISSED" : "RESOLVED";
  if (!s || !id.success) return;
  const supabase = await createClient();
  await supabase.from("reports").update({ status, resolved_by: s.user.id, resolved_at: new Date().toISOString() }).eq("id", id.data).eq("status", "PENDING");
  await audit("report.resolve", "report", id.data, { status });
  revalidatePath("/admin/reports");
}

/* ------------------------------ Usuários (service role após autorização) ------------------------------ */

async function targetUser(fd: FormData, actorId: string) {
  const id = idSchema.safeParse(str(fd, "id"));
  if (!id.success || id.data === actorId) return null;
  const { data } = await createAdminClient().from("profiles").select("id, role, username").eq("id", id.data).maybeSingle();
  return data as { id: string; role: string; username: string } | null;
}
/** CRIADOR é intocável; ADMIN só pode ser bloqueado/removido pelo CRIADOR. */
const canModerateAccount = (viewer: string, target: string) => target !== "CREATOR" && (target !== "ADMIN" || viewer === "CREATOR");

export async function setUserBlocked(fd: FormData) {
  const s = await gate("admin");
  if (!s) return;
  const target = await targetUser(fd, s.user.id);
  if (!target || !canModerateAccount(s.profile.role, target.role)) return; // só o Criador bloqueia admins
  const block = str(fd, "block") === "1";
  const admin = createAdminClient();
  await admin.from("profiles").update({ is_blocked: block }).eq("id", target.id);
  await admin.auth.admin.updateUserById(target.id, { ban_duration: block ? "876000h" : "none" }); // bloqueia login de fato
  await audit(block ? "user.block" : "user.unblock", "user", target.id, { username: target.username });
  revalidatePath("/admin/users");
}

export async function removeUser(fd: FormData) {
  const s = await gate("admin");
  if (!s) return;
  const target = await targetUser(fd, s.user.id);
  if (!target || !canModerateAccount(s.profile.role, target.role)) return;
  await createAdminClient().auth.admin.deleteUser(target.id);
  await audit("user.remove", "user", target.id, { username: target.username });
  revalidatePath("/admin/users");
}

export async function setUserRole(fd: FormData) {
  const s = await gate("admin");
  const role = roleSchema.safeParse(str(fd, "role"));
  if (!s || !role.success) return;
  const target = await targetUser(fd, s.user.id); // nunca o próprio usuário
  if (!target || target.role === "CREATOR") return; // o Criador não muda de função pelo painel
  const { count } = await createAdminClient().from("profiles").select("id", { count: "exact", head: true }).in("role", ["ADMIN", "CREATOR"]);
  if (target.role === "ADMIN" && role.data !== "ADMIN" && (count ?? 0) <= 1) return; // mantém ao menos um admin
  const supabase = await createClient(); // RLS + trigger também exigem admin com MFA
  await supabase.from("profiles").update({ role: role.data }).eq("id", target.id);
  await audit("user.role_change", "user", target.id, { from: target.role, to: role.data });
  revalidatePath("/admin/users");
}

/* ------------------------------ Categorias, tags, configurações, mídia ------------------------------ */

export async function saveCategory(_: FormState, fd: FormData): Promise<FormState> {
  const s = await gate("admin");
  if (!s) return { error: FORBIDDEN };
  const name = nameSchema.safeParse(str(fd, "name"));
  if (!name.success) return { error: "Nome inválido (2–40 caracteres)." };
  const slug = slugify(name.data);
  if (slug.length < 2) return { error: "Nome inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name: name.data, slug, description: str(fd, "description").slice(0, 200) || null });
  if (error) return { error: error.code === "23505" ? "Categoria já existe." : GENERIC_ERROR };
  await audit("category.create", "category", slug);
  revalidatePath("/admin/categories");
  return { success: "Categoria criada." };
}

export async function deleteCategory(fd: FormData) {
  const s = await gate("admin");
  const id = idSchema.safeParse(str(fd, "id"));
  if (!s || !id.success) return;
  await (await createClient()).from("categories").delete().eq("id", id.data);
  await audit("category.delete", "category", id.data);
  revalidatePath("/admin/categories");
}

export async function saveTag(_: FormState, fd: FormData): Promise<FormState> {
  const s = await gate("admin");
  if (!s) return { error: FORBIDDEN };
  const name = nameSchema.safeParse(str(fd, "name"));
  if (!name.success) return { error: "Nome inválido." };
  const { error } = await (await createClient()).from("tags").insert({ name: name.data.toLowerCase(), slug: slugify(name.data) });
  if (error) return { error: error.code === "23505" ? "Tag já existe." : GENERIC_ERROR };
  await audit("tag.create", "tag", slugify(name.data));
  revalidatePath("/admin/tags");
  return { success: "Tag criada." };
}

export async function deleteTag(fd: FormData) {
  const s = await gate("admin");
  const id = idSchema.safeParse(str(fd, "id"));
  if (!s || !id.success) return;
  await (await createClient()).from("tags").delete().eq("id", id.data);
  await audit("tag.delete", "tag", id.data);
  revalidatePath("/admin/tags");
}

export async function updateSettings(_: FormState, fd: FormData): Promise<FormState> {
  const s = await gate("admin");
  if (!s) return { error: FORBIDDEN };
  const rows = [
    { key: "registrations_open", value: str(fd, "registrations_open") === "on" },
    { key: "community_open", value: str(fd, "community_open") === "on" },
  ];
  const { error } = await (await createClient()).from("site_settings").upsert(rows);
  if (error) return { error: GENERIC_ERROR };
  await audit("settings.update", "settings", undefined, Object.fromEntries(rows.map((r) => [r.key, r.value])));
  return { success: "Configurações salvas." };
}

export async function deleteMedia(fd: FormData) {
  const s = await gate("admin");
  const id = idSchema.safeParse(str(fd, "id"));
  if (!s || !id.success) return;
  const supabase = await createClient();
  const { data: m } = await supabase.from("media").select("bucket, path").eq("id", id.data).maybeSingle();
  if (!m) return;
  await supabase.storage.from(m.bucket).remove([m.path]);
  await supabase.from("media").delete().eq("id", id.data);
  await audit("media.delete", "media", id.data, { bucket: m.bucket });
  revalidatePath("/admin/media");
}

/* ------------------------------ Dúvidas, ajuda e sugestões ------------------------------ */

export async function setFeedbackStatus(fd: FormData) {
  const s = await gate("admin");
  const id = idSchema.safeParse(str(fd, "id"));
  const status = str(fd, "status");
  if (!s || !id.success || !["NEW", "READ", "DONE"].includes(status)) return;
  await (await createClient()).from("feedback").update({ status }).eq("id", id.data);
  revalidatePath("/admin/feedback");
}

export async function deleteFeedback(fd: FormData) {
  const s = await gate("admin");
  const id = idSchema.safeParse(str(fd, "id"));
  if (!s || !id.success) return;
  await (await createClient()).from("feedback").delete().eq("id", id.data);
  await audit("feedback.delete", "feedback", id.data);
  revalidatePath("/admin/feedback");
}

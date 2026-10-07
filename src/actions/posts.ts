"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { actionSession } from "@/lib/auth";
import { allow, rateLimitMessage } from "@/lib/rate-limit";
import { communityPostSchema, firstError, idSchema } from "@/lib/validation";
import { isOwnedImageUrl } from "@/lib/sanitize";
import { isSettingOn } from "@/lib/data";
import { uploadImage } from "@/lib/upload";
import { FORBIDDEN, GENERIC_ERROR, ensureTags, parseTags, setPostTags, str, type FormState } from "./_shared";

/** Cria/edita publicação da comunidade. Com a publicação direta ligada, já entra publicada; senão, vai para aprovação. */
export async function saveCommunityPost(_: FormState, fd: FormData): Promise<FormState> {
  const s = await actionSession();
  if (!s) return { error: FORBIDDEN };
  const supabase = await createClient();

  const editingId = str(fd, "id");
  if (editingId && !idSchema.safeParse(editingId).success) return { error: GENERIC_ERROR };

  const parsed = communityPostSchema.safeParse({
    kind: str(fd, "kind"),
    title: str(fd, "title"),
    content: str(fd, "content"),
    categoryId: str(fd, "categoryId") || null,
    imageUrl: str(fd, "imageUrl") || null,
    tags: parseTags(str(fd, "tags")),
    submit: str(fd, "intent") === "submit",
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;

  if (!(await allow("post", s.user.id))) return { error: rateLimitMessage() };
  if (!editingId && !(await isSettingOn("community_open"))) return { error: "A comunidade não está aceitando novas publicações no momento." };

  let imageUrl = d.imageUrl;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    if (!(await allow("upload", s.user.id))) return { error: rateLimitMessage() };
    const up = await uploadImage(supabase, "community", s.user.id, file);
    if (!up.ok) return { error: up.error };
    imageUrl = up.url;
  }
  if (imageUrl && !isOwnedImageUrl(imageUrl, s.user.id, ["community"])) return { error: "Imagem inválida." };
  if (d.kind === "IMAGEM" && !imageUrl) return { error: "Publicações do tipo Imagem precisam de uma imagem." };

  const direct = d.submit && (await isSettingOn("community_autopublish"));
  const base = { kind: d.kind, title: d.title, content: d.content, category_id: d.categoryId, image_url: imageUrl };
  // Publicação direta; se o banco ainda não aceitar (migração 0013 não aplicada), vai para aprovação.
  const tries: string[] = d.submit ? (direct ? ["PUBLISHED", "PENDING"] : ["PENDING"]) : ["DRAFT"];

  let postId = editingId;
  let saved = false;
  for (const status of tries) {
    if (editingId) {
      const { data, error } = await supabase.from("posts").update({ ...base, status }).eq("id", editingId).eq("author_id", s.user.id).select("id");
      if (!error && data?.length) { saved = true; break; }
    } else {
      const { data, error } = await supabase.from("posts").insert({ ...base, status, author_id: s.user.id, origin: "COMMUNITY" }).select("id").single();
      if (!error && data) { postId = data.id; saved = true; break; }
    }
  }
  if (!saved) return { error: GENERIC_ERROR };
  await setPostTags(supabase, postId, await ensureTags(d.tags));
  revalidatePath("/comunidade");
  revalidatePath("/");
  redirect(`/comunidade/${postId}`);
}

export async function deleteOwnPost(fd: FormData) {
  const s = await actionSession();
  const id = idSchema.safeParse(str(fd, "id"));
  if (!s || !id.success) return;
  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", id.data).eq("author_id", s.user.id).eq("origin", "COMMUNITY");
  revalidatePath("/comunidade");
  redirect(`/perfil/${s.profile.username}`);
}

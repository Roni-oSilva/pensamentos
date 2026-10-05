"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { actionSession } from "@/lib/auth";
import { allow, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { communityPostSchema, firstError, idSchema } from "@/lib/validation";
import { isOwnedImageUrl } from "@/lib/sanitize";
import { isSettingOn } from "@/lib/data";
import { uploadImage } from "@/lib/upload";
import { FORBIDDEN, GENERIC_ERROR, ensureTags, parseTags, setPostTags, str, type FormState } from "./_shared";

/** Cria/edita publicação da comunidade. Sempre entra como DRAFT ou PENDING (moderação). */
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

  if (!(await allow("post", s.user.id))) return { error: RATE_LIMIT_MESSAGE };
  if (!editingId && !(await isSettingOn("community_open"))) return { error: "A comunidade não está aceitando novas publicações no momento." };

  let imageUrl = d.imageUrl;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    if (!(await allow("upload", s.user.id))) return { error: RATE_LIMIT_MESSAGE };
    const up = await uploadImage(supabase, "community", s.user.id, file);
    if (!up.ok) return { error: up.error };
    imageUrl = up.url;
  }
  if (imageUrl && !isOwnedImageUrl(imageUrl, s.user.id, ["community"])) return { error: "Imagem inválida." };
  if (d.kind === "IMAGEM" && !imageUrl) return { error: "Publicações do tipo Imagem precisam de uma imagem." };

  const status = d.submit ? "PENDING" : "DRAFT";
  const fields = { kind: d.kind, title: d.title, content: d.content, category_id: d.categoryId, image_url: imageUrl, status };

  let postId = editingId;
  if (editingId) {
    const { data, error } = await supabase.from("posts").update(fields).eq("id", editingId).eq("author_id", s.user.id).select("id");
    if (error || !data?.length) return { error: GENERIC_ERROR };
  } else {
    const { data, error } = await supabase.from("posts").insert({ ...fields, author_id: s.user.id, origin: "COMMUNITY" }).select("id").single();
    if (error || !data) return { error: GENERIC_ERROR };
    postId = data.id;
  }
  await setPostTags(supabase, postId, await ensureTags(d.tags));
  revalidatePath("/comunidade");
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

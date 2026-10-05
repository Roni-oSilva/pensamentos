"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { actionSession } from "@/lib/auth";
import { allow, rateLimitMessage } from "@/lib/rate-limit";
import { firstError, profileSchema } from "@/lib/validation";
import { uploadImage } from "@/lib/upload";
import { FORBIDDEN, GENERIC_ERROR, str, type FormState } from "./_shared";

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const s = await actionSession();
  if (!s) return { error: FORBIDDEN };
  const parsed = profileSchema.safeParse({ username: str(fd, "username"), displayName: str(fd, "displayName"), bio: str(fd, "bio") });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();

  const patch: Record<string, unknown> = { username: parsed.data.username, display_name: parsed.data.displayName, bio: parsed.data.bio };
  const file = fd.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (!(await allow("upload", s.user.id))) return { error: rateLimitMessage };
    const up = await uploadImage(supabase, "avatars", s.user.id, file);
    if (!up.ok) return { error: up.error };
    patch.avatar_url = up.url;
    // remove o avatar anterior (somente se estiver na pasta do próprio usuário)
    const old = s.profile.avatar_url?.split("/storage/v1/object/public/avatars/")[1];
    if (old?.startsWith(`${s.user.id}/`)) await supabase.storage.from("avatars").remove([old]);
  }
  const { error } = await supabase.from("profiles").update(patch).eq("id", s.user.id);
  if (error) return { error: error.code === "23505" ? "Esse nome de usuário já está em uso." : GENERIC_ERROR };
  revalidatePath("/", "layout");
  return { success: "Perfil atualizado." };
}

export async function markNotificationsRead() {
  const s = await actionSession();
  if (!s) return;
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", s.user.id).is("read_at", null);
  revalidatePath("/notificacoes");
}

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { actionSession } from "@/lib/auth";
import { allow, clientIp, rateLimitMessage } from "@/lib/rate-limit";
import { feedbackSchema, firstError } from "@/lib/validation";
import { GENERIC_ERROR, str, type FormState } from "./_shared";

/**
 * Dúvidas, ajuda e sugestões (botão "Ajuda"). Qualquer visitante pode enviar; a gravação é feita só pelo
 * servidor (service role) depois de validar e limitar o número de envios por pessoa e por IP.
 */
export async function submitFeedback(_: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "website")) return { success: "Obrigado! Recebemos a sua mensagem." }; // campo-isca: robôs preenchem, pessoas não
  const parsed = feedbackSchema.safeParse({ kind: str(fd, "kind"), message: str(fd, "message"), contact: str(fd, "contact"), page: str(fd, "page") });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const s = await actionSession();
  const ip = await clientIp();
  if (!(await allow("feedback", ip)) || (s && !(await allow("feedback", s.user.id)))) return { error: rateLimitMessage() };

  const d = parsed.data;
  const { error } = await createAdminClient().from("feedback").insert({
    kind: d.kind, message: d.message, contact: d.contact, page: d.page ?? null, user_id: s?.user.id ?? null,
  });
  if (error) {
    console.error(`[feedback] ${error.code ?? ""} ${error.message}`);
    return { error: GENERIC_ERROR };
  }
  return { success: "Obrigado! Recebemos a sua mensagem e vamos ler com carinho." };
}

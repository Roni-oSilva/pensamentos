/**
 * Normaliza NEXT_PUBLIC_SUPABASE_URL. Tolera erros comuns de colagem (aspas, espaços, barra final,
 * "NOME=" na frente, falta de https://) e extrai o endereço do projeto. Devolve "" se vazio.
 */
export function normalizeSupabaseUrl(raw: string | undefined): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  const hosted = v.match(/([a-z0-9]{8,}\.supabase\.(?:co|in|net))/i);
  if (hosted) return `https://${hosted[1]!.toLowerCase()}`;
  try {
    const u = new URL(v.replace(/^["']|["']$/g, ""));
    if (u.protocol === "https:" || u.protocol === "http:") return u.origin;
  } catch {
    /* cai no erro abaixo */
  }
  throw new Error(
    `NEXT_PUBLIC_SUPABASE_URL inválida (recebido: ${v.length} caracteres, começa com "${v.slice(0, 8)}…"). ` +
      "O valor deve ser o endereço do projeto, no formato https://xxxxxxxx.supabase.co",
  );
}

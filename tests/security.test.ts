import { describe, expect, it } from "vitest";

// precisa existir antes de importar @/lib/env (lido na carga do módulo)
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";

describe("sanitizeRichHtml (XSS em publicações)", async () => {
  const { sanitizeRichHtml } = await import("@/lib/sanitize");
  const cases: [string, string][] = [
    ["<script>alert(1)</script><p>ok</p>", "script"],
    ['<p onclick="x()">oi</p>', "onclick"],
    ['<a href="javascript:alert(1)">x</a>', "javascript:"],
    ['<img src=x onerror="alert(1)">', "onerror"],
    ['<img src="https://evil.com/a.png">', "evil.com"],
    ['<iframe src="https://evil.com"></iframe>', "iframe"],
    ['<svg onload=alert(1)>', "svg"],
    ['<p style="background:url(javascript:1)">x</p>', "style"],
    ['<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>', "data:"],
  ];
  for (const [input, forbidden] of cases) {
    it(`remove ${forbidden}`, () => expect(sanitizeRichHtml(input).toLowerCase()).not.toContain(forbidden));
  }
  it("mantém formatação permitida e força rel nos links", () => {
    const out = sanitizeRichHtml('<p><strong>a</strong> <em>b</em> <a href="https://x.com">l</a></p><blockquote>q</blockquote><hr>');
    expect(out).toContain("<strong>a</strong>");
    expect(out).toContain('rel="noopener noreferrer nofollow ugc"');
    expect(out).toContain("<blockquote>");
  });
  it("aceita imagens somente do Storage do projeto", () => {
    expect(sanitizeRichHtml('<img src="https://proj.supabase.co/storage/v1/object/public/admin/u/a.png">')).toContain("<img");
  });
});

describe("isOwnedImageUrl", async () => {
  const { isOwnedImageUrl } = await import("@/lib/sanitize");
  const base = "https://proj.supabase.co/storage/v1/object/public";
  it("exige bucket e pasta do usuário", () => {
    expect(isOwnedImageUrl(`${base}/community/u1/a.png`, "u1", ["community"])).toBe(true);
    expect(isOwnedImageUrl(`${base}/community/u2/a.png`, "u1", ["community"])).toBe(false);
    expect(isOwnedImageUrl(`${base}/admin/u1/a.png`, "u1", ["community"])).toBe(false);
    expect(isOwnedImageUrl("https://evil.com/community/u1/a.png", "u1", ["community"])).toBe(false);
    expect(isOwnedImageUrl(`${base}/community/u1/a.png?x=1`, "u1", ["community"])).toBe(false);
  });
});

describe("detectImageMime (upload inválido)", async () => {
  const { detectImageMime } = await import("@/lib/upload");
  const pad = (b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);
  it("reconhece JPEG/PNG/WebP pela assinatura", () => {
    expect(detectImageMime(pad([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectImageMime(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    const webp = new Uint8Array(16); webp.set([0x52, 0x49, 0x46, 0x46], 0); webp.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(detectImageMime(webp)).toBe("image/webp");
  });
  it("rejeita HTML, SVG e executáveis renomeados", () => {
    expect(detectImageMime(new TextEncoder().encode("<html><script>alert(1)</script>"))).toBeNull();
    expect(detectImageMime(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" onload="x()"/>'))).toBeNull();
    expect(detectImageMime(pad([0x4d, 0x5a, 0x90, 0x00]))).toBeNull();
    expect(detectImageMime(new Uint8Array(4))).toBeNull();
  });
});

describe("utils", async () => {
  const { safeRedirect, escapeLike, slugify } = await import("@/lib/utils");
  it("safeRedirect bloqueia open redirect", () => {
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "", null, "/a\nb"]) expect(safeRedirect(bad as string | null)).toBe("/");
    expect(safeRedirect("/comunidade?x=1")).toBe("/comunidade?x=1");
  });
  it("escapeLike neutraliza curingas e separadores de filtro", () => {
    expect(escapeLike("50%_off")).toBe("50\\%\\_off");
    expect(escapeLike("a,b)or(id.eq.1")).not.toMatch(/[,()]/);
  });
  it("slugify", () => expect(slugify("Reflexão Noturna!")).toBe("reflexao-noturna"));
});

describe("validação de entrada", async () => {
  const v = await import("@/lib/validation");
  it("senha fraca é rejeitada", () => {
    expect(v.passwordSchema.safeParse("curta1").success).toBe(false);
    expect(v.passwordSchema.safeParse("somenteletras").success).toBe(false);
    expect(v.passwordSchema.safeParse("umasenhaboa123").success).toBe(true);
  });
  it("username: formato e nomes reservados", () => {
    expect(v.usernameSchema.safeParse("admin").success).toBe(false);
    expect(v.usernameSchema.safeParse("a b").success).toBe(false);
    expect(v.usernameSchema.safeParse("<script>").success).toBe(false);
    expect(v.usernameSchema.safeParse("Herege_01").data).toBe("herege_01");
  });
  it("comentário: vazio e longo demais", () => {
    const id = "00000000-0000-4000-8000-000000000000";
    expect(v.commentSchema.safeParse({ postId: id, body: "   " }).success).toBe(false);
    expect(v.commentSchema.safeParse({ postId: id, body: "x".repeat(1001) }).success).toBe(false);
    expect(v.commentSchema.safeParse({ postId: "1 or 1=1", body: "oi" }).success).toBe(false);
  });
  it("post comunitário não aceita tipo 'NOTA' nem tags demais", () => {
    const base = { kind: "FRASE", content: "x", tags: [], submit: true };
    expect(v.communityPostSchema.safeParse({ ...base, kind: "NOTA" }).success).toBe(false);
    expect(v.communityPostSchema.safeParse({ ...base, tags: ["aa", "bb", "cc", "dd", "ee", "ff"] }).success).toBe(false);
  });
  it("role e status só aceitam valores do enum", () => {
    expect(v.roleSchema.safeParse("SUPERADMIN").success).toBe(false);
    expect(v.statusSchema.safeParse("PUBLISHED").success).toBe(true);
  });
});

describe("auditoria não registra segredos", async () => {
  const { scrubMetadata } = await import("@/lib/audit");
  it("redige chaves sensíveis", () => {
    const out = scrubMetadata({ password: "x", access_token: "y", nested: { service_role_key: "z", ok: 1 }, kind: "FRASE" }) as Record<string, unknown>;
    expect(out.password).toBe("[redacted]");
    expect(out.access_token).toBe("[redacted]");
    expect((out.nested as Record<string, unknown>).service_role_key).toBe("[redacted]");
    expect(out.kind).toBe("FRASE");
  });
});

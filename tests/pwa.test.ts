import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import manifest from "@/app/manifest";

const pub = (p: string) => path.join(__dirname, "..", "public", p.replace(/^\//, ""));

describe("app instalável (PWA)", () => {
  const m = manifest();
  it("tem nome, cores e modo app", () => {
    expect(m.name).toBe("Igreja de Cristo");
    expect(m.display).toBe("standalone");
    expect(m.start_url).toMatch(/^\//);
    expect(m.theme_color).toBe("#050505");
  });
  it("tem ícones 192 e 512, comuns e maskable, e todos os arquivos existem", () => {
    const icons = m.icons ?? [];
    for (const size of ["192x192", "512x512"]) {
      expect(icons.some((i) => i.sizes === size && i.purpose === "any")).toBe(true);
      expect(icons.some((i) => i.sizes === size && i.purpose === "maskable")).toBe(true);
    }
    for (const i of icons) expect(existsSync(pub(i.src)), i.src).toBe(true);
    for (const s of m.shortcuts ?? []) for (const i of s.icons ?? []) expect(existsSync(pub(i.src)), i.src).toBe(true);
    for (const s of m.screenshots ?? []) expect(existsSync(pub(s.src)), s.src).toBe(true);
  });
  it("o service worker não guarda páginas HTML em cache e tem página offline", () => {
    const sw = readFileSync(pub("/sw.js"), "utf8");
    expect(sw).toContain('req.mode === "navigate"');
    expect(sw).toContain("/offline.html");
    expect(sw).not.toMatch(/cache\.put\(req[^)]*\)\s*;?\s*\/\/\s*html/i);
    expect(sw).toContain('if (req.method !== "GET") return;');
    expect(existsSync(pub("/offline.html"))).toBe(true);
  });
});

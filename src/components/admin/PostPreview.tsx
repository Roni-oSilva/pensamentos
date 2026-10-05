"use client";
import { useEffect, useState } from "react";
import { KIND_LABEL, type PostKind } from "@/lib/constants";

/**
 * Preview local: lê o HTML do campo oculto do editor. Renderiza dentro de iframe sandbox
 * (sem scripts) para que nenhum HTML malicioso colado no editor execute no painel.
 */
export function PostPreview({ title, kind }: { title: string; kind: PostKind }) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    const el = document.querySelector<HTMLInputElement>('input[name="content"]');
    setHtml(el?.value ?? "");
  }, []);
  const doc = `<!doctype html><meta charset="utf-8"><style>body{background:#050505;color:#ededed;font:20px/1.7 Georgia,serif;margin:0;padding:28px}
blockquote{border-left:2px solid #8b1e2d;margin:1.5rem 0;padding-left:1.2rem;font-style:italic;color:#a3a3a3}hr{border:0;border-top:1px solid #333;margin:2rem 0}img{max-width:100%}a{color:#ededed}</style>
<p style="font:12px sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#737373">${KIND_LABEL[kind]}</p>
<h1 style="font-weight:400;font-size:2.2rem">${title.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`)}</h1>${html}`;
  return <iframe title="Pré-visualização" sandbox="" srcDoc={doc} className="h-[480px] w-full rounded-md border border-ink-600" />;
}

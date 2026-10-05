"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useState } from "react";
import { uploadDirect } from "@/components/ui/ImageUploadField";

/** Editor rico (TipTap). O HTML é sanitizado de novo no servidor — nunca confiar neste valor. */
export function RichEditor({ name = "content", initialHtml = "" }: { name?: string; initialHtml?: string }) {
  const [html, setHtml] = useState(initialHtml);
  const [error, setError] = useState<string | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }, code: false, codeBlock: false, strike: false, underline: false,
        link: { openOnClick: false, autolink: false, HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" } },
      }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: "Escreva a heresia…" }),
    ],
    content: initialHtml,
    editorProps: { attributes: { class: "rich min-h-[260px] rounded-b-md border border-t-0 border-ink-600 bg-ink-900 px-5 py-4 focus:outline-none", "aria-label": "Conteúdo" } },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });
  if (!editor) return <div className="field min-h-[320px]" aria-busy />;

  const btn = (label: string, active: boolean, run: () => void, title?: string) => (
    <button type="button" title={title ?? label} aria-pressed={active} onClick={run}
      className={`rounded px-2.5 py-1.5 text-sm ${active ? "bg-ash-100 text-ink-950" : "text-ash-300 hover:bg-ink-700"}`}>{label}</button>
  );

  function setLink() {
    const prev = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link (https://…)", prev ?? "https://");
    if (url === null) return;
    if (url === "") return void editor!.chain().focus().unsetLink().run();
    if (!/^(https?:\/\/|mailto:)/i.test(url)) return setError("Use um link http(s):// ou mailto:");
    setError(null);
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }
  async function addImage(file: File | undefined) {
    if (!file) return;
    setError(null);
    const r = await uploadDirect("admin", file);
    if (!r.ok) return setError(r.error);
    editor!.chain().focus().setImage({ src: r.url, alt: "" }).run();
  }

  return (
    <div>
      <div role="toolbar" aria-label="Formatação" className="flex flex-wrap gap-1 rounded-t-md border border-ink-600 bg-ink-800 p-1.5">
        {btn("N", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "Negrito")}
        {btn("I", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Itálico")}
        {btn("H2", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "Título")}
        {btn("❝", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "Citação")}
        {btn("• Lista", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run())}
        {btn("1. Lista", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run())}
        {btn("—", false, () => editor.chain().focus().setHorizontalRule().run(), "Separador")}
        {btn("Link", editor.isActive("link"), setLink)}
        <label className="cursor-pointer rounded px-2.5 py-1.5 text-sm text-ash-300 hover:bg-ink-700">
          Imagem<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { void addImage(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}

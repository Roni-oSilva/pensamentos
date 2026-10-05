"use client";
import { useActionState } from "react";
import { saveOfficialPost } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { POST_KINDS, KIND_LABEL } from "@/lib/constants";
import type { Category, Post } from "@/lib/types";
import { RichEditor } from "./RichEditor";
import { PostPreview } from "./PostPreview";
import { useState } from "react";

export function OfficialPostForm({ post, categories }: { post?: Post; categories: Category[] }) {
  const [state, action] = useActionState(saveOfficialPost, {});
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState({ title: post?.title ?? "", kind: post?.kind ?? "FRASE" });
  return (
    <form action={action} className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}
      {post?.image_url && <input type="hidden" name="imageUrl" value={post.image_url} />}
      <div className="grid gap-5 md:grid-cols-[1fr_14rem]">
        <div><label className="label" htmlFor="title">Título (opcional)</label>
          <input id="title" name="title" maxLength={140} defaultValue={post?.title ?? ""} className="field text-lg" onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} /></div>
        <div><label className="label" htmlFor="kind">Tipo</label>
          <select id="kind" name="kind" defaultValue={post?.kind ?? "FRASE"} className="field" onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as typeof d.kind }))}>
            {POST_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select></div>
      </div>
      <div><span className="label">Conteúdo</span><RichEditor initialHtml={post?.content ?? ""} /></div>
      <div className="grid gap-5 md:grid-cols-2">
        <div><label className="label" htmlFor="categoryId">Categoria</label>
          <select id="categoryId" name="categoryId" defaultValue={post?.category_id ?? ""} className="field">
            <option value="">Sem categoria</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
        <div><label className="label" htmlFor="tags">Tags (separadas por vírgula)</label>
          <input id="tags" name="tags" maxLength={200} defaultValue={post?.post_tags.map((t) => t.tag?.name).filter(Boolean).join(", ") ?? ""} className="field" /></div>
      </div>
      <div><label className="label" htmlFor="image">Imagem de capa (JPG/PNG/WebP até 8 MB)</label>
        <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="field file:mr-3 file:rounded file:border-0 file:bg-ink-700 file:px-3 file:py-1 file:text-ash-100" />
        {post?.image_url && <p className="mt-1 text-xs text-ash-400">Já há uma imagem. Enviar outra substitui.</p>}</div>
      <FormMessage state={state} />
      <div className="flex flex-wrap items-center gap-3 border-t border-ink-700 pt-5">
        <SubmitButton className="btn-ghost">Salvar rascunho</SubmitButton>
        <button type="button" className="btn-ghost" onClick={() => setPreview((v) => !v)}>{preview ? "Fechar preview" : "Visualizar"}</button>
        <PublishButton />
      </div>
      {preview && <PostPreview title={draft.title} kind={draft.kind} />}
    </form>
  );
}

function PublishButton() {
  return <button type="submit" name="intent" value="publish" className="btn-primary">Publicar</button>;
}

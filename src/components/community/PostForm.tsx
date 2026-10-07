"use client";
import { useActionState, useState } from "react";
import { saveCommunityPost } from "@/actions/posts";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { FormMessage } from "@/components/ui/FormMessage";
import { COMMUNITY_KINDS, KIND_LABEL, type PostKind } from "@/lib/constants";
import type { Category, Post } from "@/lib/types";

export function PostForm({ post, categories, defaultKind, autopublish = true }: { post?: Post; categories: Category[]; defaultKind?: PostKind; autopublish?: boolean }) {
  const [state, action] = useActionState(saveCommunityPost, {});
  const [content, setContent] = useState(post?.content ?? "");
  const [kind, setKind] = useState<PostKind>((post?.kind as PostKind) ?? defaultKind ?? "FRASE");
  const hint: Partial<Record<PostKind, string>> = {
    VERSICULO: "Escreva o versículo. Coloque a referência (ex.: João 3:16) no campo Título.",
    ORACAO: "Escreva a sua oração…", CONSELHO: "Compartilhe um conselho que edifique…", FRASE: "Escreva uma frase de fé…",
  };
  return (
    <form action={action} className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}
      <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
        <div><label className="label" htmlFor="kind">Tipo</label>
          <select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as PostKind)} className="field">
            {COMMUNITY_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select></div>
        <div><label className="label" htmlFor="title">{kind === "VERSICULO" ? "Referência (ex.: João 3:16)" : "Título (opcional)"}</label><input id="title" name="title" maxLength={140} defaultValue={post?.title ?? ""} className="field" /></div>
      </div>
      <div>
        <label className="label" htmlFor="content">Conteúdo</label>
        <textarea id="content" name="content" required maxLength={5000} rows={10} value={content} onChange={(e) => setContent(e.target.value)} className="field font-display text-lg leading-relaxed" placeholder={hint[kind] ?? "Compartilhe com a comunidade…"} />
        <p className="mt-1 text-right text-xs text-ash-400">{content.length}/5000 · texto puro (sem HTML)</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="label" htmlFor="categoryId">Categoria</label>
          <select id="categoryId" name="categoryId" defaultValue={post?.category_id ?? ""} className="field"><option value="">Sem categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label" htmlFor="tags">Tags (até 5, separadas por vírgula)</label>
          <input id="tags" name="tags" defaultValue={post?.post_tags.map((t) => t.tag?.name).filter(Boolean).join(", ") ?? ""} className="field" /></div>
      </div>
      <ImageUploadField bucket="community" initialUrl={post?.image_url} label="Imagem (opcional)" hint="JPG, PNG ou WebP até 50 MB." />
      <p className="text-xs text-ash-400">{autopublish ? "Sua publicação aparece na hora para toda a comunidade. Siga as diretrizes: a equipe pode ocultar o que for impróprio." : "Publicações passam por aprovação antes de aparecerem na comunidade."}</p>
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-3">
        <button type="submit" name="intent" value="submit" className="btn-primary">{autopublish ? (post?.status === "PUBLISHED" ? "Salvar alterações" : "Publicar") : "Enviar para aprovação"}</button>
        <button type="submit" name="intent" value="draft" className="btn-ghost">Salvar rascunho</button>
      </div>
    </form>
  );
}

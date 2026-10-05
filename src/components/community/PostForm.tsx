"use client";
import Image from "next/image";
import { useActionState, useState } from "react";
import { saveCommunityPost } from "@/actions/posts";
import { FormMessage } from "@/components/ui/FormMessage";
import { COMMUNITY_KINDS, KIND_LABEL } from "@/lib/constants";
import type { Category, Post } from "@/lib/types";

export function PostForm({ post, categories }: { post?: Post; categories: Category[] }) {
  const [state, action] = useActionState(saveCommunityPost, {});
  const [content, setContent] = useState(post?.content ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <form action={action} className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}
      {post?.image_url && <input type="hidden" name="imageUrl" value={post.image_url} />}
      <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
        <div><label className="label" htmlFor="kind">Tipo</label>
          <select id="kind" name="kind" defaultValue={post?.kind ?? "FRASE"} className="field">
            {COMMUNITY_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select></div>
        <div><label className="label" htmlFor="title">Título (opcional)</label><input id="title" name="title" maxLength={140} defaultValue={post?.title ?? ""} className="field" /></div>
      </div>
      <div>
        <label className="label" htmlFor="content">Conteúdo</label>
        <textarea id="content" name="content" required maxLength={5000} rows={10} value={content} onChange={(e) => setContent(e.target.value)} className="field font-display text-lg leading-relaxed" placeholder="Deixe passar pela cabeça…" />
        <p className="mt-1 text-right text-xs text-ash-400">{content.length}/5000 · texto puro (sem HTML)</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="label" htmlFor="categoryId">Categoria</label>
          <select id="categoryId" name="categoryId" defaultValue={post?.category_id ?? ""} className="field"><option value="">Sem categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="label" htmlFor="tags">Tags (até 5, separadas por vírgula)</label>
          <input id="tags" name="tags" defaultValue={post?.post_tags.map((t) => t.tag?.name).filter(Boolean).join(", ") ?? ""} className="field" /></div>
      </div>
      <div>
        <label className="label" htmlFor="image">Imagem (opcional · JPG/PNG/WebP até 5 MB)</label>
        <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="field file:mr-3 file:rounded file:border-0 file:bg-ink-700 file:px-3 file:py-1 file:text-ash-100"
          onChange={(e) => { const f = e.target.files?.[0]; setPreview(f ? URL.createObjectURL(f) : null); }} />
        {(preview || post?.image_url) && <Image src={preview ?? post!.image_url!} alt="Prévia da imagem" width={240} height={150} unoptimized={!!preview} className="mt-3 h-auto rounded-md border border-ink-600" />}
      </div>
      <p className="text-xs text-ash-400">Publicações passam por moderação antes de aparecerem na comunidade.</p>
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-3">
        <button type="submit" name="intent" value="submit" className="btn-primary">Enviar para aprovação</button>
        <button type="submit" name="intent" value="draft" className="btn-ghost">Salvar rascunho</button>
      </div>
    </form>
  );
}

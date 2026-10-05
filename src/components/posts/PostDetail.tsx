import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import type { PostWithViewer } from "@/lib/types";
import { KIND_LABEL, ROLE_LABEL, STATUS_LABEL } from "@/lib/constants";
import { excerpt, formatDate, compact, toPlainText } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { CommentSection } from "@/components/comments/CommentSection";
import { PostBody } from "./PostBody";
import { ActionBar } from "./ActionBar";
import { ViewTracker } from "./ViewTracker";
import { postPath } from "./PostCard";

export function PostDetail({ post, signedIn }: { post: PostWithViewer; signedIn: boolean }) {
  const published = post.status === "PUBLISHED";
  return (
    <article className="container-narrow pt-14">
      {published && <ViewTracker postId={post.id} />}
      {!published && (
        <p role="status" className="mb-8 rounded-md border border-ink-500 bg-ink-800 px-4 py-3 text-sm text-ash-200">
          Status: <strong>{STATUS_LABEL[post.status]}</strong>
          {post.status === "PENDING" && " — aguardando aprovação de um moderador. Só você e a equipe veem esta página."}
          {post.status === "REJECTED" && post.rejection_reason ? ` — motivo: ${post.rejection_reason}` : ""}
        </p>
      )}
      <header className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-ash-400">
          <span className="badge">{KIND_LABEL[post.kind]}</span>
          {post.category && <Link href={`/categoria/${post.category.slug}`} className="badge hover:border-ash-400">{post.category.name}</Link>}
          <time dateTime={post.published_at ?? post.created_at}>{formatDate(post.published_at ?? post.created_at)}</time>
          <span>{compact(post.view_count)} visualizações</span>
        </div>
        {post.title && <h1 className="font-poster uppercase tracking-wide text-4xl leading-tight text-white sm:text-5xl">{post.title}</h1>}
      </header>
      {post.image_url && (
        <div className="relative mb-8 aspect-[16/10] overflow-hidden rounded-lg border border-ink-700">
          <Image src={post.image_url} alt={post.title ?? "Imagem da publicação"} fill priority sizes="(min-width:768px) 768px, 100vw" className="object-cover" />
        </div>
      )}
      <PostBody content={post.content} origin={post.origin} />
      <div className="mt-6 flex flex-wrap gap-2">
        {post.post_tags.map((t) => t.tag && <Link key={t.tag.slug} href={`/explorar?tag=${t.tag.slug}`} className="text-sm text-ash-400 hover:text-white">#{t.tag.name}</Link>)}
      </div>
      {post.origin === "COMMUNITY" && post.author && (
        <Link href={`/perfil/${post.author.username}`} className="mt-8 flex items-center gap-3 border-y border-ink-700 py-4 hover:bg-ink-900/60">
          <Avatar src={post.author.avatar_url} name={post.author.username} size={42} />
          <div><p className="text-white">{post.author.display_name ?? post.author.username}</p><p className="text-sm text-ash-400">@{post.author.username} · {ROLE_LABEL[post.author.role]}</p></div>
        </Link>
      )}
      <div className="mt-6">
        {published && (
          <ActionBar postId={post.id} path={postPath(post)} title={post.title ?? excerpt(post.content, 80)} text={toPlainText(post.content)} signedIn={signedIn}
            liked={post.liked} favorited={post.favorited} likes={post.like_count} comments={post.comment_count} favorites={post.favorite_count} shares={post.share_count} />
        )}
      </div>
      {published && (
        <div className="mt-14">
          <Suspense fallback={<p className="text-sm text-ash-400">Carregando comentários…</p>}><CommentSection postId={post.id} /></Suspense>
        </div>
      )}
    </article>
  );
}

export function postMetadata(post: PostWithViewer | null) {
  if (!post || post.status !== "PUBLISHED") return { title: "Heresia", robots: { index: false } };
  const text = excerpt(post.content, 160);
  return {
    title: post.title ?? text.slice(0, 60),
    description: text,
    openGraph: { title: post.title ?? text.slice(0, 60), description: text, type: "article" as const, images: post.image_url ? [post.image_url] : undefined },
  };
}

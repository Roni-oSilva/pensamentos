import Link from "next/link";
import Image from "next/image";
import type { PostWithViewer } from "@/lib/types";
import { KIND_LABEL } from "@/lib/constants";
import { compact, excerpt, timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { ActionBar } from "./ActionBar";

export function postPath(p: Pick<PostWithViewer, "id" | "origin">) {
  return p.origin === "OFFICIAL" ? `/frases/${p.id}` : `/comunidade/${p.id}`;
}

/** Card minimalista. Usa apenas texto puro (excerpt) — seguro para renderizar no cliente. */
export function PostCard({ post, signedIn, featured = false }: { post: PostWithViewer; signedIn: boolean; featured?: boolean }) {
  const path = postPath(post);
  const short = post.kind === "FRASE" && post.content.length < 220;
  const text = excerpt(post.content, featured ? 320 : 220);
  return (
    <article className="card group flex animate-rise flex-col gap-4 p-6 hover:border-ink-500">
      <header className="flex items-center justify-between gap-3 text-xs text-ash-400">
        <span className="badge">{KIND_LABEL[post.kind]}</span>
        <span>{post.published_at ? timeAgo(post.published_at) : ""}</span>
      </header>
      {post.image_url && (
        <Link href={path} className="relative block aspect-[16/10] overflow-hidden rounded-md border border-ink-700">
          <Image src={post.image_url} alt={post.title ?? "Imagem da publicação"} fill sizes="(min-width:1024px) 400px, 100vw" loading="lazy" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
        </Link>
      )}
      <Link href={path} className="block space-y-2">
        {post.title && <h3 className="font-display text-2xl leading-tight text-white">{post.title}</h3>}
        <p className={`preline font-display leading-snug text-ash-100 ${short ? "text-2xl" : "text-lg text-ash-200"}`}>{text}</p>
      </Link>
      <div className="flex flex-wrap gap-1.5">
        {post.category && <Link href={`/categoria/${post.category.slug}`} className="badge hover:border-ash-400">{post.category.name}</Link>}
        {post.post_tags.map((t) => t.tag && <Link key={t.tag.slug} href={`/explorar?tag=${t.tag.slug}`} className="text-xs text-ash-400 hover:text-white">#{t.tag.name}</Link>)}
      </div>
      <footer className="mt-auto space-y-3 border-t border-ink-700 pt-4">
        {post.origin === "COMMUNITY" && post.author && (
          <Link href={`/perfil/${post.author.username}`} className="flex items-center gap-2.5 text-sm text-ash-300 hover:text-white">
            <Avatar src={post.author.avatar_url} name={post.author.username} size={26} />
            <span>@{post.author.username}</span>
            <span className="ml-auto text-xs text-ash-400">{compact(post.view_count)} visualizações</span>
          </Link>
        )}
        <ActionBar postId={post.id} path={path} title={post.title ?? excerpt(post.content, 80)} signedIn={signedIn}
          liked={post.liked} favorited={post.favorited} likes={post.like_count} comments={post.comment_count}
          favorites={post.favorite_count} shares={post.share_count} />
      </footer>
    </article>
  );
}

import Link from "next/link";
import Image from "next/image";
import type { PostWithViewer } from "@/lib/types";
import { KIND_LABEL } from "@/lib/constants";
import { compact, excerpt, timeAgo, toPlainText } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { TiltCard } from "@/components/ui/TiltCard";
import { ActionBar } from "./ActionBar";

export function postPath(p: Pick<PostWithViewer, "id" | "origin">) {
  return p.origin === "OFFICIAL" ? `/frases/${p.id}` : `/comunidade/${p.id}`;
}

/** Caixa de publicação: inclina com o mouse, holofote vermelho, aspas gigantes. Só texto puro (seguro no cliente). */
export function PostCard({ post, signedIn, featured = false }: { post: PostWithViewer; signedIn: boolean; featured?: boolean }) {
  const path = postPath(post);
  const short = post.kind === "FRASE" && post.content.length < 220;
  const text = excerpt(post.content, featured ? 320 : 220);
  return (
    <article className="h-full animate-rise">
      <TiltCard>
        <span className="tilt-quote" aria-hidden>“</span>
        <div className="relative flex h-full flex-col gap-4 p-6">
          <header className="flex items-center gap-3">
            {post.origin === "COMMUNITY" && post.author ? (
              <Link href={`/perfil/${post.author.username}`} className="group/a flex min-w-0 flex-1 items-center gap-3 active:opacity-80">
                <span className="rounded-full bg-gradient-to-tr from-poster via-[#f59e0b] to-poster p-[2px]"><span className="block rounded-full border-2 border-ink-950"><Avatar src={post.author.avatar_url} name={post.author.username} size={38} /></span></span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white group-hover/a:text-poster">{post.author.display_name || post.author.username}</span>
                  <span className="tick block truncate">@{post.author.username}</span>
                </span>
              </Link>
            ) : (
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <span className="rounded-full bg-gradient-to-tr from-poster via-[#f59e0b] to-poster p-[2px]"><span className="grid h-[38px] w-[38px] place-items-center rounded-full border-2 border-ink-950 bg-ink-900 font-poster text-lg leading-none text-poster">H</span></span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white">Heresias</span>
                  <span className="tick block truncate">Oficial</span>
                </span>
              </span>
            )}
            <span className="tick shrink-0 text-right"><span className="inline-flex items-center gap-2"><span className="h-px w-4 bg-poster" />{KIND_LABEL[post.kind]}</span><span className="block normal-case tracking-normal">{post.published_at ? timeAgo(post.published_at) : ""}</span></span>
          </header>
          {post.image_url && (
            <Link href={path} className="relative block aspect-[16/10] overflow-hidden rounded-md border border-ink-700">
              <Image src={post.image_url} alt={post.title ?? "Imagem da publicação"} fill sizes="(min-width:1024px) 400px, 100vw" loading="lazy" className="object-cover transition duration-500 hover:scale-[1.05]" />
            </Link>
          )}
          <Link href={path} className="group/t block space-y-3">
            {post.title && <h3 className="font-poster text-3xl uppercase leading-none tracking-wide text-white transition-colors group-hover/t:text-poster">{post.title}</h3>}
            <p className={`preline font-display leading-snug ${short ? "text-2xl text-ash-100" : "text-lg text-ash-200"}`}>{text}</p>
          </Link>
          <div className="flex flex-wrap items-center gap-1.5">
            {post.category && <Link href={`/categoria/${post.category.slug}`} className="badge hover:border-poster hover:text-white">{post.category.name}</Link>}
            {post.post_tags.map((t) => t.tag && <Link key={t.tag.slug} href={`/explorar?tag=${t.tag.slug}`} className="text-xs text-ash-400 hover:text-poster">#{t.tag.name}</Link>)}
          </div>
          <footer className="mt-auto space-y-3 border-t border-ink-700 pt-4">
            {post.origin === "COMMUNITY" && <p className="tick text-right">{compact(post.view_count)} views</p>}
            <ActionBar postId={post.id} path={path} title={post.title ?? excerpt(post.content, 80)} text={toPlainText(post.content)} signedIn={signedIn}
              liked={post.liked} favorited={post.favorited} likes={post.like_count} comments={post.comment_count}
              favorites={post.favorite_count} shares={post.share_count} />
          </footer>
        </div>
      </TiltCard>
    </article>
  );
}

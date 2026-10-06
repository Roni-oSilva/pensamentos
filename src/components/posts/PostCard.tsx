import Link from "next/link";
import Image from "next/image";
import type { PostWithViewer } from "@/lib/types";
import { KIND_LABEL } from "@/lib/constants";
import { compact, excerpt, timeAgo, toPlainText } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { TiltCard } from "@/components/ui/TiltCard";
import { ActionBar } from "./ActionBar";
import { DoubleTapLike } from "./DoubleTapLike";

export function postPath(p: Pick<PostWithViewer, "id" | "origin">) {
  return p.origin === "OFFICIAL" ? `/frases/${p.id}` : `/comunidade/${p.id}`;
}

/** Caixa de publicação: inclina com o mouse, holofote vermelho, aspas gigantes. Só texto puro (seguro no cliente). */
export function PostCard({ post, signedIn, featured = false }: { post: PostWithViewer; signedIn: boolean; featured?: boolean }) {
  const path = postPath(post);
  const isVerse = post.kind === "VERSICULO";
  const isPrayer = post.kind === "ORACAO";
  const short = (post.kind === "FRASE" || isVerse || isPrayer || post.kind === "CONSELHO") && post.content.length < 220;
  const text = excerpt(post.content, featured ? 320 : 240);
  // cada tipo ganha um acento próprio: dourado para o versículo, azul-claro para a oração, vermelho para os demais
  const accent = isVerse ? "text-verse" : isPrayer ? "text-prayer" : "text-poster";
  const bar = isVerse ? "bg-verse" : isPrayer ? "bg-prayer" : "bg-poster";
  return (
    <article className="h-full animate-rise">
      <TiltCard>
        <span className={`tilt-quote ${isVerse || isPrayer ? "tilt-cross" : ""}`} aria-hidden>{isVerse || isPrayer ? "✝" : "“"}</span>
        <span aria-hidden className={`absolute inset-y-6 left-0 w-[3px] rounded-r ${bar} opacity-70`} />
        <div className="relative flex h-full flex-col gap-4 p-6">
          <header className="flex items-start gap-3">
            {post.author ? (
              <Link href={`/perfil/${post.author.username}`} className="group/a flex min-w-0 flex-1 items-center gap-3 active:opacity-80">
                <span className="shrink-0 rounded-full bg-gradient-to-tr from-poster via-[#f59e0b] to-poster p-[2px]"><span className="block rounded-full border-2 border-ink-950"><Avatar src={post.author.avatar_url} name={post.author.username} size={40} /></span></span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white group-hover/a:text-poster">{post.author.display_name || post.author.username}</span>
                  <span className="block truncate text-xs text-ash-400">@{post.author.username}{post.published_at ? ` · ${timeAgo(post.published_at)}` : ""}</span>
                </span>
              </Link>
            ) : (
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <span className="shrink-0 rounded-full bg-gradient-to-tr from-poster via-[#f59e0b] to-poster p-[2px]"><span className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink-950 bg-ink-900 text-lg leading-none text-poster">✝</span></span>
                <span className="min-w-0">
                  <span className="church-name block text-[0.95rem] text-white">Igreja de <span className="church-accent text-poster">Cristo</span></span>
                  <span className="block truncate text-xs text-ash-400">{post.published_at ? timeAgo(post.published_at) : ""}</span>
                </span>
              </span>
            )}
            <span className="tick flex shrink-0 flex-col items-end gap-1 pt-0.5">
              <span className={`inline-flex items-center gap-2 ${accent}`}><span className={`h-px w-4 ${bar}`} />{KIND_LABEL[post.kind]}</span>
              {post.origin === "OFFICIAL" && <span className="rounded-full border border-poster/60 px-2 py-px text-[9px] text-poster">Oficial</span>}
            </span>
          </header>
          {post.image_url && (
            <Link href={path} className="relative block aspect-[16/10] overflow-hidden rounded-md border border-ink-700">
              <Image src={post.image_url} alt={post.title ?? "Imagem da publicação"} fill sizes="(min-width:1024px) 400px, 100vw" loading="lazy" className="object-cover transition duration-500 hover:scale-[1.05]" />
            </Link>
          )}
          <DoubleTapLike postId={post.id} href={path} className="group/t block space-y-3">
            {post.title && !isVerse && <h3 className="font-poster text-3xl uppercase leading-none tracking-wide text-white transition-colors group-hover/t:text-poster">{post.title}</h3>}
            <p className={`preline font-display [text-wrap:pretty] ${isVerse ? "text-[1.7rem] italic leading-[1.3] text-white" : short ? "text-2xl leading-snug text-ash-100" : "text-lg leading-relaxed text-ash-200"}`}>
              {isVerse ? `“${text}”` : text}
            </p>
            {isVerse && post.title && <p className={`text-xs font-medium uppercase tracking-[0.25em] ${accent}`}>— {post.title}</p>}
          </DoubleTapLike>
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

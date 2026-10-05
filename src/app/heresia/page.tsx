import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { randomPost } from "@/lib/data";
import { PostBody } from "@/components/posts/PostBody";
import { ActionBar } from "@/components/posts/ActionBar";
import { ViewTracker } from "@/components/posts/ViewTracker";
import { postPath } from "@/components/posts/PostCard";
import { RandomButton } from "./RandomButton";
import { KIND_LABEL } from "@/lib/constants";
import { excerpt, toPlainText } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Uma heresia", robots: { index: false } };

export default async function HeresiaPage() {
  const session = await getSession();
  const post = await randomPost(null, session?.user.id ?? null);
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-5 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,30,45,0.14),transparent_65%)] animate-flicker" />
      {!post ? (
        <div className="relative text-center"><p className="font-display text-4xl text-white">Nenhuma heresia ainda.</p><Link className="btn-ghost mt-6" href="/">Voltar</Link></div>
      ) : (
        <article key={post.id} className="relative mx-auto max-w-2xl animate-rise text-center">
          <ViewTracker postId={post.id} />
          <p className="eyebrow mb-8">{KIND_LABEL[post.kind]}{post.origin === "COMMUNITY" && post.author ? ` · @${post.author.username}` : ""}</p>
          {post.title && <h1 className="mb-6 font-poster uppercase tracking-wide text-3xl italic text-ash-300">{post.title}</h1>}
          <div className="text-left sm:text-center [&_.rich]:text-3xl [&_.rich]:leading-snug [&>div>p]:text-3xl sm:[&>div>p]:text-4xl sm:[&_.rich]:text-4xl"><PostBody content={post.content} origin={post.origin} /></div>
          <div className="mx-auto mt-12 flex max-w-sm flex-col items-center gap-6">
            <RandomButton />
            <Link href={postPath(post)} className="link-muted text-sm">Abrir publicação</Link>
            <ActionBar postId={post.id} path={postPath(post)} title={post.title ?? excerpt(post.content, 80)} text={toPlainText(post.content)} signedIn={!!session}
              liked={post.liked} favorited={post.favorited} likes={post.like_count} comments={post.comment_count} favorites={post.favorite_count} shares={post.share_count} />
          </div>
        </article>
      )}
    </div>
  );
}

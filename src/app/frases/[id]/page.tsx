import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPost } from "@/lib/data";
import { idSchema } from "@/lib/validation";
import { PostDetail, postMetadata } from "@/components/posts/PostDetail";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!idSchema.safeParse(id).success) return null;
  const s = await getSession();
  const post = await getPost(id, s?.user.id ?? null);
  if (post?.origin === "COMMUNITY") redirect(`/comunidade/${post.id}`);
  return post ? { post, signedIn: !!s } : null;
}

export async function generateMetadata({ params }: Props) {
  return postMetadata((await load((await params).id))?.post ?? null);
}

export default async function FraseDetail({ params }: Props) {
  const data = await load((await params).id);
  if (!data) notFound();
  return <PostDetail post={data.post} signedIn={data.signedIn} />;
}

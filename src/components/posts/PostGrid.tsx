import type { PostWithViewer } from "@/lib/types";
import { PostCard } from "./PostCard";

export function PostGrid({ posts, signedIn, cols = 3 }: { posts: PostWithViewer[]; signedIn: boolean; cols?: 2 | 3 }) {
  return (
    <div className={`grid gap-5 md:grid-cols-2 ${cols === 3 ? "lg:grid-cols-3" : ""}`}>
      {posts.map((p) => <PostCard key={p.id} post={p} signedIn={signedIn} />)}
    </div>
  );
}

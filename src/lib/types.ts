import type { PostKind, PostStatus, Role } from "./constants";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: Role;
  is_blocked: boolean;
  created_at: string;
}

export interface AuthorLite {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: Role;
}

export interface Post {
  id: string;
  author_id: string;
  origin: "OFFICIAL" | "COMMUNITY";
  kind: PostKind;
  status: PostStatus;
  title: string | null;
  content: string;
  image_url: string | null;
  category_id: string | null;
  rejection_reason: string | null;
  published_at: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  favorite_count: number;
  share_count: number;
  created_at: string;
  author: AuthorLite | null;
  category: { name: string; slug: string } | null;
  post_tags: { tag: { name: string; slug: string } | null }[];
}

export interface PostWithViewer extends Post {
  liked: boolean;
  favorited: boolean;
}

export interface CommentRow {
  id: string;
  post_id: string;
  parent_id: string | null;
  body: string;
  status: "VISIBLE" | "HIDDEN";
  created_at: string;
  edited_at: string | null;
  author_id: string;
  author: AuthorLite | null;
}

export interface Category { id: string; name: string; slug: string; description: string | null }
export interface Tag { id: string; name: string; slug: string }

export type Result<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

-- =====================================================================
-- Heresias que passam pela minha cabeça — schema base
-- Executar em ordem. Idempotência não é garantida: use migrations versionadas.
-- =====================================================================
create extension if not exists pg_trgm with schema extensions;

-- ---------- Tipos ----------
create type public.user_role         as enum ('USER', 'MODERATOR', 'ADMIN');
create type public.post_status       as enum ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN', 'DELETED');
create type public.post_kind         as enum ('FRASE', 'PENSAMENTO', 'REFLEXAO', 'TEXTO', 'POEMA', 'IMAGEM', 'NOTA');
create type public.post_origin       as enum ('OFFICIAL', 'COMMUNITY');
create type public.comment_status    as enum ('VISIBLE', 'HIDDEN');
create type public.report_reason     as enum ('SPAM', 'INAPPROPRIATE', 'HARASSMENT', 'FRAUD', 'ILLEGAL', 'OTHER');
create type public.report_target     as enum ('POST', 'COMMENT', 'PROFILE');
create type public.report_status     as enum ('PENDING', 'RESOLVED', 'DISMISSED');
create type public.notification_type as enum ('LIKE', 'COMMENT', 'REPLY', 'FOLLOW', 'POST_APPROVED', 'POST_REJECTED', 'REPORT_RESOLVED');

-- ---------- Perfis (sem e-mail: o e-mail vive somente em auth.users) ----------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null,
  display_name text,
  avatar_url   text,
  bio          text,
  role         public.user_role not null default 'USER',
  is_blocked   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$'),
  constraint profiles_display_name_len check (display_name is null or char_length(display_name) between 1 and 50),
  constraint profiles_bio_len check (bio is null or char_length(bio) <= 280),
  constraint profiles_avatar_len check (avatar_url is null or char_length(avatar_url) <= 500)
);
create unique index profiles_username_key on public.profiles (username);
create index profiles_username_trgm on public.profiles using gin (username extensions.gin_trgm_ops);
create index profiles_role_idx on public.profiles (role) where role <> 'USER';

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 2 and 40),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,48}$'),
  description text check (description is null or char_length(description) <= 200),
  created_at  timestamptz not null default now()
);

create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (char_length(name) between 2 and 30),
  slug       text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  created_at timestamptz not null default now()
);

create table public.posts (
  id               uuid primary key default gen_random_uuid(),
  author_id        uuid not null references public.profiles (id) on delete cascade,
  origin           public.post_origin not null default 'COMMUNITY',
  kind             public.post_kind not null default 'FRASE',
  status           public.post_status not null default 'PENDING',
  title            text check (title is null or char_length(title) between 1 and 140),
  content          text not null check (char_length(content) between 1 and 30000),
  image_url        text check (image_url is null or char_length(image_url) <= 600),
  category_id      uuid references public.categories (id) on delete set null,
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 300),
  published_at     timestamptz,
  view_count       integer not null default 0 check (view_count >= 0),
  like_count       integer not null default 0 check (like_count >= 0),
  comment_count    integer not null default 0 check (comment_count >= 0),
  favorite_count   integer not null default 0 check (favorite_count >= 0),
  share_count      integer not null default 0 check (share_count >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index posts_feed_idx     on public.posts (origin, published_at desc) where status = 'PUBLISHED';
create index posts_likes_idx    on public.posts (origin, like_count desc, published_at desc) where status = 'PUBLISHED';
create index posts_comments_idx on public.posts (origin, comment_count desc, published_at desc) where status = 'PUBLISHED';
create index posts_author_idx   on public.posts (author_id, created_at desc);
create index posts_status_idx   on public.posts (status, origin, created_at desc);
create index posts_category_idx on public.posts (category_id) where status = 'PUBLISHED';
create index posts_title_trgm   on public.posts using gin (title extensions.gin_trgm_ops);
create index posts_content_trgm on public.posts using gin (content extensions.gin_trgm_ops);

create table public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id  uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);
create index post_tags_tag_idx on public.post_tags (tag_id);

create table public.likes (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  post_id    uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index likes_post_idx on public.likes (post_id);
create index likes_created_idx on public.likes (created_at);

create table public.favorites (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  post_id    uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index favorites_user_idx on public.favorites (user_id, created_at desc);
create index favorites_post_idx on public.favorites (post_id);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  parent_id  uuid references public.comments (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  status     public.comment_status not null default 'VISIBLE',
  created_at timestamptz not null default now()
);
create index comments_post_idx   on public.comments (post_id, created_at);
create index comments_author_idx on public.comments (author_id, created_at desc);
create index comments_parent_idx on public.comments (parent_id) where parent_id is not null;

create table public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  post_id     uuid references public.posts (id) on delete cascade,
  comment_id  uuid references public.comments (id) on delete cascade,
  profile_id  uuid references public.profiles (id) on delete cascade,
  reason      public.report_reason not null,
  details     text check (details is null or char_length(details) <= 500),
  status      public.report_status not null default 'PENDING',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  constraint reports_one_target check (
    (target_type = 'POST'    and post_id is not null    and comment_id is null and profile_id is null) or
    (target_type = 'COMMENT' and comment_id is not null and post_id is null    and profile_id is null) or
    (target_type = 'PROFILE' and profile_id is not null and post_id is null    and comment_id is null)
  )
);
create unique index reports_unique_post    on public.reports (reporter_id, post_id)    where post_id is not null;
create unique index reports_unique_comment on public.reports (reporter_id, comment_id) where comment_id is not null;
create unique index reports_unique_profile on public.reports (reporter_id, profile_id) where profile_id is not null;
create index reports_status_idx on public.reports (status, created_at desc);

create table public.media (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  bucket     text not null check (bucket in ('avatars', 'community', 'admin')),
  path       text not null,
  mime_type  text not null,
  size_bytes integer not null check (size_bytes > 0),
  created_at timestamptz not null default now(),
  unique (bucket, path)
);
create index media_owner_idx on public.media (owner_id, created_at desc);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       public.notification_type not null,
  actor_id   uuid references public.profiles (id) on delete cascade,
  post_id    uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

create table public.audit_logs (
  id            bigint generated always as identity primary key,
  admin_id      uuid references public.profiles (id) on delete set null,
  action        text not null check (char_length(action) <= 80),
  resource_type text not null check (char_length(resource_type) <= 40),
  resource_id   text check (resource_id is null or char_length(resource_id) <= 80),
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_admin_idx on public.audit_logs (admin_id, created_at desc);

create table public.site_settings (
  key        text primary key check (key ~ '^[a-z_]{2,40}$'),
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Rate limit por janela fixa. Acessada apenas pelo servidor (service_role).
create table public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  hits         integer not null default 1,
  primary key (key, window_start)
);

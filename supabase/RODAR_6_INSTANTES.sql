-- Instantes: fotos rápidas tiradas na hora (sem galeria, sem edição), como o Instants do Instagram.
-- - Vão para os "amigos": quem você segue e também segue você.
-- - Cada pessoa abre uma única vez; depois some. Quem não abrir em 24 h não vê mais.
-- - O autor guarda os próprios instantes por 30 dias (arquivo), com quem viu e as reações.
-- - A foto fica num bucket PRIVADO; o servidor só entrega um link temporário a quem pode ver.
-- Pode ser rodado mais de uma vez.

create table if not exists public.instants (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles (id) on delete cascade,
  path       text not null check (path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|webp)$'),
  caption    text check (caption is null or char_length(caption) between 1 and 80),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
create index if not exists instants_author_idx on public.instants (author_id, created_at desc);
create index if not exists instants_expires_idx on public.instants (expires_at);

create table if not exists public.instant_views (
  instant_id uuid not null references public.instants (id) on delete cascade,
  viewer_id  uuid not null references public.profiles (id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  reaction   text check (reaction is null or reaction in ('❤️', '🙏', '🔥', '😂', '😮')),
  primary key (instant_id, viewer_id)
);

alter table public.instants enable row level security;
alter table public.instant_views enable row level security;

-- Amizade = seguir nos dois sentidos.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.follows where follower_id = a and following_id = b)
         and exists (select 1 from public.follows where follower_id = b and following_id = a) $$;
revoke all on function public.are_friends(uuid, uuid) from public, anon;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

-- O autor vê e apaga os próprios; ninguém mais lê a tabela direto (só pelas funções abaixo).
drop policy if exists instants_select_own on public.instants;
drop policy if exists instants_insert_own on public.instants;
drop policy if exists instants_delete_own on public.instants;
create policy instants_select_own on public.instants for select to authenticated using (author_id = (select auth.uid()));
create policy instants_insert_own on public.instants for insert to authenticated with check (
  author_id = (select auth.uid()) and (select public.can_write())
  and path like ((select auth.uid())::text || '/%')
  and expires_at <= now() + interval '24 hours 1 minute');
create policy instants_delete_own on public.instants for delete to authenticated using (author_id = (select auth.uid()));
revoke update on public.instants from anon, authenticated;

-- Visualizações: o autor vê quem viu os dele; quem viu vê a própria; a reação só pode ser trocada por quem viu.
drop policy if exists instant_views_select on public.instant_views;
drop policy if exists instant_views_react on public.instant_views;
create policy instant_views_select on public.instant_views for select to authenticated using (
  viewer_id = (select auth.uid())
  or exists (select 1 from public.instants i where i.id = instant_id and i.author_id = (select auth.uid())));
create policy instant_views_react on public.instant_views for update to authenticated
  using (viewer_id = (select auth.uid())) with check (viewer_id = (select auth.uid()));
revoke insert, delete on public.instant_views from anon, authenticated;
revoke update on public.instant_views from anon, authenticated;
grant update (reaction) on public.instant_views to authenticated;

-- Caixa de entrada: instantes de amigos, ainda válidos e ainda não abertos por mim (sem revelar a foto).
create or replace function public.instants_inbox()
returns table (id uuid, author_id uuid, username text, display_name text, avatar_url text, created_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select i.id, p.id, p.username, p.display_name, p.avatar_url, i.created_at, i.expires_at
    from public.instants i
    join public.profiles p on p.id = i.author_id
   where i.expires_at > now()
     and i.author_id <> auth.uid()
     and not p.is_blocked
     and public.are_friends(auth.uid(), i.author_id)
     and not exists (select 1 from public.instant_views v where v.instant_id = i.id and v.viewer_id = auth.uid())
   order by i.created_at
$$;
revoke all on function public.instants_inbox() from public, anon;
grant execute on function public.instants_inbox() to authenticated;

-- Abrir um instante: confere tudo, registra que foi visto (só uma vez) e devolve o caminho da foto.
create or replace function public.instant_open(p_id uuid)
returns table (path text, caption text, author_id uuid, created_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare me uuid := auth.uid(); r public.instants;
begin
  if me is null or not public.can_write() then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into r from public.instants where id = p_id;
  if not found or r.expires_at <= now() or r.author_id = me
     or public.is_user_blocked(r.author_id) or not public.are_friends(me, r.author_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  insert into public.instant_views (instant_id, viewer_id) values (p_id, me)
  on conflict (instant_id, viewer_id) do nothing;
  if not found then raise exception 'already viewed' using errcode = '42501'; end if;  -- abre uma vez só
  return query select r.path, r.caption, r.author_id, r.created_at;
end $$;
revoke all on function public.instant_open(uuid) from public, anon;
grant execute on function public.instant_open(uuid) to authenticated;

-- Bucket privado das fotos (o servidor envia e gera links temporários com a chave de serviço).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('instants', 'instants', false, 6291456, array['image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

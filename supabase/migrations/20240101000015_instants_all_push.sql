-- 1) Instantes para TODOS os membros (antes: só amigos). Continua: abre uma vez só e expira em 24 h.
-- 2) Notificações push (apitam no celular mesmo com o app fechado): aparelhos inscritos e preferências.
-- Pode ser rodado mais de uma vez.

-- Caixa de entrada: instantes de qualquer membro (menos os meus e os de contas bloqueadas), ainda não abertos.
create or replace function public.instants_inbox()
returns table (id uuid, author_id uuid, username text, display_name text, avatar_url text, created_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select i.id, p.id, p.username, p.display_name, p.avatar_url, i.created_at, i.expires_at
    from public.instants i
    join public.profiles p on p.id = i.author_id
   where auth.uid() is not null
     and i.expires_at > now()
     and i.author_id <> auth.uid()
     and not p.is_blocked
     and not exists (select 1 from public.instant_views v where v.instant_id = i.id and v.viewer_id = auth.uid())
   order by i.created_at
$$;
revoke all on function public.instants_inbox() from public, anon;
grant execute on function public.instants_inbox() to authenticated;

-- Abrir: qualquer membro logado e ativo, uma única vez, dentro das 24 h.
create or replace function public.instant_open(p_id uuid)
returns table (path text, caption text, author_id uuid, created_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare me uuid := auth.uid(); r public.instants;
begin
  if me is null or not public.can_write() then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into r from public.instants where id = p_id;
  if not found or r.expires_at <= now() or r.author_id = me or public.is_user_blocked(r.author_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  insert into public.instant_views (instant_id, viewer_id) values (p_id, me)
  on conflict (instant_id, viewer_id) do nothing;
  if not found then raise exception 'already viewed' using errcode = '42501'; end if;  -- abre uma vez só
  return query select r.path, r.caption, r.author_id, r.created_at;
end $$;
revoke all on function public.instant_open(uuid) from public, anon;
grant execute on function public.instant_open(uuid) to authenticated;

-- Aparelhos inscritos para notificações push (um registro por navegador/celular).
create table if not exists public.push_subscriptions (
  endpoint        text primary key check (endpoint like 'https://%' and char_length(endpoint) <= 1000),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  p256dh          text not null check (char_length(p256dh) <= 200),
  auth            text not null check (char_length(auth) <= 100),
  notify_instants boolean not null default true,  -- avisar quando alguém postar um Instante
  notify_posts    boolean not null default true,  -- avisar quando alguém publicar na Comunidade
  created_at      timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
-- cada um vê e apaga os próprios aparelhos; gravação e envio são feitos pelo servidor (chave de serviço)
drop policy if exists push_select_own on public.push_subscriptions;
drop policy if exists push_delete_own on public.push_subscriptions;
create policy push_select_own on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy push_delete_own on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));
revoke insert, update on public.push_subscriptions from anon, authenticated;

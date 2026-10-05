-- =====================================================================
-- Funções auxiliares de autorização, triggers e RPCs
-- =====================================================================

-- Papel do usuário logado (NULL se anônimo ou bloqueado)
create or replace function public.auth_role()
returns public.user_role
language sql stable security definer set search_path = public, auth
as $$
  select p.role from public.profiles p where p.id = auth.uid() and not p.is_blocked
$$;

-- Contas com MFA verificado precisam estar em AAL2 para ter poderes de staff.
create or replace function public.mfa_ok()
returns boolean
language sql stable security definer set search_path = public, auth
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified')
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, auth
as $$ select coalesce(public.auth_role() = 'ADMIN', false) and public.mfa_ok() $$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public, auth
as $$ select coalesce(public.auth_role() in ('MODERATOR', 'ADMIN'), false) and public.mfa_ok() $$;

-- Usuário autenticado e não bloqueado
create or replace function public.can_write()
returns boolean language sql stable security definer set search_path = public, auth
as $$ select exists (select 1 from public.profiles p where p.id = auth.uid() and not p.is_blocked) $$;

create or replace function public.is_user_blocked(p_user uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select is_blocked from public.profiles where id = p_user), true) $$;

-- ---------- updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger posts_touch    before update on public.posts    for each row execute function public.touch_updated_at();

-- ---------- Criação automática de perfil (role SEMPRE 'USER') ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  base text; candidate text; n int := 0;
  reserved text[] := array['admin','administrador','moderador','moderator','heresias','suporte','support','root','system','sistema'];
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', ''), '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base) < 3 or base = any (reserved) then
    base := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  base := left(base, 20);
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;
  insert into public.profiles (id, username, display_name) values (new.id, candidate, candidate);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Guarda de colunas sensíveis: PROFILES ----------
-- Atualizações aninhadas (triggers) ou sem JWT (service_role / SQL Editor) passam.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 or auth.uid() is null then return new; end if;
  new.id := old.id;
  new.created_at := old.created_at;
  new.is_blocked := old.is_blocked;          -- bloqueio só via service_role (server action admin)
  if not public.is_admin() or old.id = auth.uid() then
    new.role := old.role;                    -- ninguém altera a própria role; só ADMIN altera a de outros
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile_update();

-- ---------- Guarda de colunas sensíveis: POSTS ----------
create or replace function public.guard_post_update()
returns trigger language plpgsql security definer set search_path = public
as $$
declare staff boolean := public.is_staff();
begin
  if pg_trigger_depth() > 1 or auth.uid() is null then return new; end if;
  -- ninguém (via API de usuário) mexe em contadores, autoria ou origem
  new.author_id := old.author_id;
  new.origin := old.origin;
  new.view_count := old.view_count;
  new.like_count := old.like_count;
  new.comment_count := old.comment_count;
  new.favorite_count := old.favorite_count;
  new.share_count := old.share_count;
  if not staff then
    new.rejection_reason := old.rejection_reason;
    new.published_at := old.published_at;
    -- editar conteúdo já publicado/rejeitado volta para moderação
    if old.status in ('PUBLISHED', 'REJECTED')
       and (new.title, new.content, new.image_url, new.kind, new.category_id)
           is distinct from (old.title, old.content, old.image_url, old.kind, old.category_id) then
      new.status := 'PENDING';
    end if;
  end if;
  if new.status = 'PUBLISHED' and old.status <> 'PUBLISHED' then
    new.published_at := coalesce(new.published_at, now());
    new.rejection_reason := null;
  end if;
  return new;
end $$;
create trigger posts_guard before update on public.posts for each row execute function public.guard_post_update();

-- Garante published_at ao inserir já publicado e impede contadores forjados no INSERT
create or replace function public.guard_post_insert()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.view_count := 0; new.like_count := 0; new.comment_count := 0; new.favorite_count := 0; new.share_count := 0;
    new.rejection_reason := null;
  end if;
  if new.status = 'PUBLISHED' then new.published_at := coalesce(new.published_at, now()); end if;
  return new;
end $$;
create trigger posts_guard_insert before insert on public.posts for each row execute function public.guard_post_insert();

-- ---------- Comentários: respostas de 1 nível, no mesmo post ----------
create or replace function public.guard_comment_insert()
returns trigger language plpgsql security definer set search_path = public
as $$
declare p record;
begin
  if new.parent_id is not null then
    select post_id, parent_id into p from public.comments where id = new.parent_id;
    if not found or p.post_id <> new.post_id or p.parent_id is not null then
      raise exception 'invalid parent comment' using errcode = '22023';
    end if;
  end if;
  return new;
end $$;
create trigger comments_guard_insert before insert on public.comments for each row execute function public.guard_comment_insert();

-- ---------- Contadores (somente via triggers) ----------
create or replace function public.bump_post_counter(p_post uuid, p_col text, p_delta int)
returns void language plpgsql security definer set search_path = public
as $$
begin
  execute format('update public.posts set %I = greatest(%I + $1, 0) where id = $2', p_col, p_col) using p_delta, p_post;
end $$;
revoke all on function public.bump_post_counter(uuid, text, int) from public, anon, authenticated;

create or replace function public.trg_like_counter() returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  if tg_op = 'INSERT' then
    perform public.bump_post_counter(new.post_id, 'like_count', 1);
    select author_id into author from public.posts where id = new.post_id;
    if author is not null and author <> new.user_id then
      insert into public.notifications (user_id, type, actor_id, post_id) values (author, 'LIKE', new.user_id, new.post_id);
    end if;
  else
    perform public.bump_post_counter(old.post_id, 'like_count', -1);
  end if;
  return null;
end $$;
create trigger likes_counter after insert or delete on public.likes for each row execute function public.trg_like_counter();

create or replace function public.trg_favorite_counter() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then perform public.bump_post_counter(new.post_id, 'favorite_count', 1);
  else perform public.bump_post_counter(old.post_id, 'favorite_count', -1); end if;
  return null;
end $$;
create trigger favorites_counter after insert or delete on public.favorites for each row execute function public.trg_favorite_counter();

create or replace function public.trg_comment_counter() returns trigger language plpgsql security definer set search_path = public as $$
declare post_author uuid; parent_author uuid;
begin
  if tg_op = 'INSERT' then
    if new.status = 'VISIBLE' then perform public.bump_post_counter(new.post_id, 'comment_count', 1); end if;
    select author_id into post_author from public.posts where id = new.post_id;
    if new.parent_id is not null then
      select author_id into parent_author from public.comments where id = new.parent_id;
      if parent_author is not null and parent_author <> new.author_id then
        insert into public.notifications (user_id, type, actor_id, post_id, comment_id) values (parent_author, 'REPLY', new.author_id, new.post_id, new.id);
      end if;
    end if;
    if post_author is not null and post_author <> new.author_id and post_author is distinct from parent_author then
      insert into public.notifications (user_id, type, actor_id, post_id, comment_id) values (post_author, 'COMMENT', new.author_id, new.post_id, new.id);
    end if;
  elsif tg_op = 'DELETE' then
    if old.status = 'VISIBLE' then perform public.bump_post_counter(old.post_id, 'comment_count', -1); end if;
  else
    if old.status = 'VISIBLE' and new.status <> 'VISIBLE' then perform public.bump_post_counter(new.post_id, 'comment_count', -1);
    elsif old.status <> 'VISIBLE' and new.status = 'VISIBLE' then perform public.bump_post_counter(new.post_id, 'comment_count', 1); end if;
  end if;
  return null;
end $$;
create trigger comments_counter after insert or delete or update of status on public.comments for each row execute function public.trg_comment_counter();

create or replace function public.trg_follow_notify() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, actor_id) values (new.following_id, 'FOLLOW', new.follower_id);
  return null;
end $$;
create trigger follows_notify after insert on public.follows for each row execute function public.trg_follow_notify();

create or replace function public.trg_post_status_notify() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.origin = 'COMMUNITY' and new.status is distinct from old.status and auth.uid() is distinct from new.author_id then
    if new.status = 'PUBLISHED' then
      insert into public.notifications (user_id, type, actor_id, post_id) values (new.author_id, 'POST_APPROVED', auth.uid(), new.id);
    elsif new.status = 'REJECTED' then
      insert into public.notifications (user_id, type, actor_id, post_id) values (new.author_id, 'POST_REJECTED', auth.uid(), new.id);
    end if;
  end if;
  return null;
end $$;
create trigger posts_status_notify after update of status on public.posts for each row execute function public.trg_post_status_notify();

create or replace function public.trg_report_notify() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'RESOLVED' and old.status = 'PENDING' then
    insert into public.notifications (user_id, type, actor_id, post_id) values (new.reporter_id, 'REPORT_RESOLVED', auth.uid(), new.post_id);
  end if;
  return null;
end $$;
create trigger reports_notify after update of status on public.reports for each row execute function public.trg_report_notify();

-- ---------- Rate limit (janela fixa) — só service_role ----------
create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public
as $$
declare w timestamptz; h int;
begin
  w := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, w, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into h;
  return h <= p_limit;
end $$;

create or replace function public.purge_rate_limits() returns void language sql security definer set search_path = public
as $$ delete from public.rate_limits where window_start < now() - interval '2 days' $$;

-- ---------- Visualizações e compartilhamentos (somente servidor) ----------
create or replace function public.register_view(p_post uuid) returns void language sql security definer set search_path = public
as $$ update public.posts set view_count = view_count + 1 where id = p_post and status = 'PUBLISHED' $$;

create or replace function public.register_share(p_post uuid) returns void language sql security definer set search_path = public
as $$ update public.posts set share_count = share_count + 1 where id = p_post and status = 'PUBLISHED' $$;

revoke all on function public.rate_limit_hit(text, int, int), public.purge_rate_limits(), public.register_view(uuid), public.register_share(uuid) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int), public.purge_rate_limits(), public.register_view(uuid), public.register_share(uuid) to service_role;

-- ---------- RPCs públicas (security invoker: RLS vale) ----------
create or replace function public.random_post_id(p_origin public.post_origin default null)
returns uuid language sql stable
as $$
  select id from public.posts
  where status = 'PUBLISHED' and (p_origin is null or origin = p_origin)
  order by random() limit 1
$$;

-- Em alta: engajamento ponderado com decaimento por idade (14 dias)
create or replace function public.trending_post_ids(p_origin public.post_origin default null, p_limit int default 12, p_offset int default 0)
returns table (id uuid) language sql stable
as $$
  select p.id from public.posts p
  where p.status = 'PUBLISHED' and p.published_at > now() - interval '14 days' and (p_origin is null or p.origin = p_origin)
  order by (p.like_count * 3 + p.comment_count * 4 + p.favorite_count * 2 + p.share_count * 2 + p.view_count * 0.1 + 1)
           / power(extract(epoch from (now() - p.published_at)) / 3600 + 2, 1.4) desc, p.published_at desc
  limit least(p_limit, 50) offset greatest(p_offset, 0)
$$;

create or replace function public.profile_stats(p_user uuid)
returns jsonb language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'posts',          (select count(*) from public.posts where author_id = p_user and status = 'PUBLISHED'),
    'likes_received', (select coalesce(sum(like_count), 0) from public.posts where author_id = p_user and status = 'PUBLISHED'),
    'followers',      (select count(*) from public.follows where following_id = p_user),
    'following',      (select count(*) from public.follows where follower_id = p_user)
  )
  where not public.is_user_blocked(p_user)
$$;

-- ---------- Auditoria: escrita só por staff, admin_id sempre = auth.uid() ----------
create or replace function public.log_audit(p_action text, p_resource_type text, p_resource_id text default null, p_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into public.audit_logs (admin_id, action, resource_type, resource_id, metadata)
  values (auth.uid(), left(p_action, 80), left(p_resource_type, 40), left(p_resource_id, 80), coalesce(p_metadata, '{}'::jsonb));
end $$;
revoke all on function public.log_audit(text, text, text, jsonb) from public, anon;
grant execute on function public.log_audit(text, text, text, jsonb) to authenticated;

-- ---------- Estatísticas administrativas (sem dados privados) ----------
create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare result jsonb;
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  select jsonb_build_object(
    'users',            (select count(*) from public.profiles),
    'active_users_30d', (select count(*) from (
        select author_id as u from public.posts    where created_at > now() - interval '30 days'
        union select author_id from public.comments where created_at > now() - interval '30 days'
        union select user_id   from public.likes     where created_at > now() - interval '30 days') a),
    'posts',            (select count(*) from public.posts where status <> 'DELETED'),
    'posts_published',  (select count(*) from public.posts where status = 'PUBLISHED'),
    'posts_pending',    (select count(*) from public.posts where status = 'PENDING'),
    'likes',            (select count(*) from public.likes),
    'comments',         (select count(*) from public.comments),
    'views',            (select coalesce(sum(view_count), 0) from public.posts),
    'reports_pending',  (select count(*) from public.reports where status = 'PENDING'),
    'top_posts', coalesce((select jsonb_agg(t) from (
        select id, coalesce(title, left(content, 60)) as title, like_count, comment_count, view_count
        from public.posts where status = 'PUBLISHED' order by like_count + comment_count * 2 + view_count * 0.1 desc limit 5) t), '[]'),
    'top_users', coalesce((select jsonb_agg(t) from (
        select p.username, count(*) as posts from public.posts x join public.profiles p on p.id = x.author_id
        where x.status = 'PUBLISHED' and x.origin = 'COMMUNITY' group by p.username order by count(*) desc limit 5) t), '[]')
  ) into result;
  return result;
end $$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

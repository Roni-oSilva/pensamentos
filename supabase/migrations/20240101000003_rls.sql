-- =====================================================================
-- Row Level Security — negar por padrão; cada tabela tem políticas explícitas
-- =====================================================================
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.tags           enable row level security;
alter table public.posts          enable row level security;
alter table public.post_tags      enable row level security;
alter table public.likes          enable row level security;
alter table public.favorites      enable row level security;
alter table public.comments       enable row level security;
alter table public.follows        enable row level security;
alter table public.reports        enable row level security;
alter table public.media          enable row level security;
alter table public.notifications  enable row level security;
alter table public.audit_logs     enable row level security;
alter table public.site_settings  enable row level security;
alter table public.rate_limits    enable row level security;

-- Defesa em profundidade: anônimo nunca escreve; rate_limits/audit_logs são fechados.
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke all on public.rate_limits from anon, authenticated;
revoke insert, update, delete, truncate on public.audit_logs from anon, authenticated;
revoke truncate on all tables in schema public from authenticated;

-- Nota de performance: funções de autorização são envolvidas em (select …) para o Postgres
-- avaliá-las uma vez por consulta (InitPlan) e não uma vez por linha.

-- ---------- profiles ----------
create policy profiles_select on public.profiles for select
  using (not is_blocked or id = (select auth.uid()) or (select public.is_staff()));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid()) and (select public.can_write())) with check (id = (select auth.uid()));
create policy profiles_update_admin on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
-- sem INSERT (trigger de auth) e sem DELETE (cascade via auth.users, feito no servidor)

-- ---------- categories / tags / settings ----------
create policy categories_select on public.categories for select using (true);
create policy categories_admin  on public.categories for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy tags_select on public.tags for select using (true);
create policy tags_admin  on public.tags for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy settings_select on public.site_settings for select using (true);
create policy settings_admin  on public.site_settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- posts ----------
create policy posts_select on public.posts for select using (
  (status = 'PUBLISHED' and not public.is_user_blocked(author_id))
  or author_id = (select auth.uid())
  or (select public.is_staff())
);
create policy posts_insert_user on public.posts for insert to authenticated with check (
  author_id = (select auth.uid()) and (select public.can_write())
  and origin = 'COMMUNITY' and status in ('DRAFT', 'PENDING')
);
create policy posts_insert_admin on public.posts for insert to authenticated with check (
  author_id = (select auth.uid()) and (select public.is_admin()) and origin = 'OFFICIAL'
);
create policy posts_update_author on public.posts for update to authenticated
  using (author_id = (select auth.uid()) and (select public.can_write()) and origin = 'COMMUNITY' and status in ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED'))
  with check (author_id = (select auth.uid()) and origin = 'COMMUNITY' and status in ('DRAFT', 'PENDING'));
create policy posts_update_staff on public.posts for update to authenticated
  using ((select public.is_admin()) or ((select public.is_staff()) and origin = 'COMMUNITY'))
  with check ((select public.is_admin()) or ((select public.is_staff()) and origin = 'COMMUNITY'));
create policy posts_delete_author on public.posts for delete to authenticated
  using (author_id = (select auth.uid()) and (select public.can_write()) and origin = 'COMMUNITY');
create policy posts_delete_admin on public.posts for delete to authenticated using ((select public.is_admin()));

-- ---------- post_tags ----------
create policy post_tags_select on public.post_tags for select using (exists (select 1 from public.posts p where p.id = post_id));
create policy post_tags_write on public.post_tags for all to authenticated
  using ((select public.is_admin()) or exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()) and (select public.can_write())))
  with check ((select public.is_admin()) or exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()) and (select public.can_write())));

-- ---------- likes / favorites (privados: cada um vê só os seus) ----------
create policy likes_select on public.likes for select to authenticated using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy likes_insert on public.likes for insert to authenticated with check (
  user_id = (select auth.uid()) and (select public.can_write())
  and exists (select 1 from public.posts p where p.id = post_id and p.status = 'PUBLISHED'));
create policy likes_delete on public.likes for delete to authenticated using (user_id = (select auth.uid()));

create policy favorites_select on public.favorites for select to authenticated using (user_id = (select auth.uid()));
create policy favorites_insert on public.favorites for insert to authenticated with check (
  user_id = (select auth.uid()) and (select public.can_write())
  and exists (select 1 from public.posts p where p.id = post_id and p.status = 'PUBLISHED'));
create policy favorites_delete on public.favorites for delete to authenticated using (user_id = (select auth.uid()));

-- ---------- comments ----------
create policy comments_select on public.comments for select using (
  (status = 'VISIBLE' and exists (select 1 from public.posts p where p.id = post_id and p.status = 'PUBLISHED') and not public.is_user_blocked(author_id))
  or author_id = (select auth.uid()) or (select public.is_staff())
);
create policy comments_insert on public.comments for insert to authenticated with check (
  author_id = (select auth.uid()) and (select public.can_write()) and status = 'VISIBLE'
  and exists (select 1 from public.posts p where p.id = post_id and p.status = 'PUBLISHED'));
create policy comments_update_staff on public.comments for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy comments_delete on public.comments for delete to authenticated using (author_id = (select auth.uid()) or (select public.is_staff()));
-- Staff só pode alterar o status; o corpo é imutável via coluna:
revoke update on public.comments from authenticated;
grant update (status) on public.comments to authenticated;

-- ---------- follows (contagens públicas) ----------
create policy follows_select on public.follows for select using (true);
create policy follows_insert on public.follows for insert to authenticated with check (follower_id = (select auth.uid()) and (select public.can_write()));
create policy follows_delete on public.follows for delete to authenticated using (follower_id = (select auth.uid()));

-- ---------- reports ----------
create policy reports_insert on public.reports for insert to authenticated with check (
  reporter_id = (select auth.uid()) and (select public.can_write()) and status = 'PENDING' and resolved_by is null);
create policy reports_select on public.reports for select to authenticated using (reporter_id = (select auth.uid()) or (select public.is_staff()));
create policy reports_update_staff on public.reports for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy reports_delete_admin on public.reports for delete to authenticated using ((select public.is_admin()));
revoke update on public.reports from authenticated;
grant update (status, resolved_by, resolved_at) on public.reports to authenticated;

-- ---------- media ----------
create policy media_select on public.media for select to authenticated using (owner_id = (select auth.uid()) or (select public.is_staff()));
create policy media_insert on public.media for insert to authenticated with check (
  owner_id = (select auth.uid()) and (select public.can_write())
  and (bucket <> 'admin' or (select public.is_staff()))
  and path like (select auth.uid())::text || '/%');
create policy media_delete on public.media for delete to authenticated using (owner_id = (select auth.uid()) or (select public.is_admin()));

-- ---------- notifications (só os próprios; usuário apenas marca como lida) ----------
create policy notifications_select on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notifications_delete on public.notifications for delete to authenticated using (user_id = (select auth.uid()));
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ---------- audit_logs: somente ADMIN lê; ninguém escreve diretamente ----------
create policy audit_select on public.audit_logs for select to authenticated using ((select public.is_admin()));

-- ---------- rate_limits: RLS ligada, nenhuma política => só service_role ----------

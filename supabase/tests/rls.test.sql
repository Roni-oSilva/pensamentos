-- Testes de RLS / privilégios. Execução: ver docs/SECURITY.md (npm run test:db)
-- Cada asserção lança exceção se falhar. Roda como superusuário e alterna de role com SET LOCAL.
\set ON_ERROR_STOP on
begin;

-- helpers ---------------------------------------------------------------
create or replace function pg_temp.as_user(u uuid, aal text default 'aal1') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated', 'aal', aal)::text, true);
  execute 'set local role authenticated';
end $$;
create or replace function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role anon';
end $$;
create or replace function pg_temp.as_su() returns void language plpgsql as $$
begin execute 'reset role'; perform set_config('request.jwt.claims', '', true); end $$;
-- Espera erro (RLS / permissão / check) ao executar o SQL
create or replace function pg_temp.must_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then return; end;
  raise exception 'FALHOU (deveria ser negado): %', label;
end $$;
-- Espera que o comando afete 0 linhas (RLS filtra silenciosamente)
create or replace function pg_temp.must_affect_zero(sql text, label text) returns void language plpgsql as $$
declare n int;
begin
  execute sql; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALHOU (afetou % linhas): %', n, label; end if;
end $$;
create or replace function pg_temp.must_see_zero(tbl text, label text) returns void language plpgsql as $$
declare n int;
begin execute format('select count(*) from %s', tbl) into n;
  if n <> 0 then raise exception 'FALHOU (viu % linhas): %', n, label; end if; end $$;
create or replace function pg_temp.assert_eq(a anyelement, b anyelement, label text) returns void language plpgsql as $$
begin if a is distinct from b then raise exception 'FALHOU: % (obtido %, esperado %)', label, a, b; end if; end $$;

-- fixtures --------------------------------------------------------------
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', '{"username":"Admin","role":"ADMIN"}'),     -- tenta se passar por admin via metadata
  ('00000000-0000-0000-0000-0000000000b1', '{"username":"alice"}'),
  ('00000000-0000-0000-0000-0000000000b2', '{"username":"bob"}'),
  ('00000000-0000-0000-0000-0000000000b3', '{"username":"mod"}');

select pg_temp.assert_eq((select role::text from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'USER', 'metadata não concede role');
select pg_temp.assert_eq((select username from public.profiles where id = '00000000-0000-0000-0000-00000000000a') <> 'admin', true, 'username reservado é trocado');

-- promoções feitas fora da API (SQL Editor/service role)
update public.profiles set role = 'ADMIN' where id = '00000000-0000-0000-0000-00000000000a';
update public.profiles set role = 'MODERATOR' where id = '00000000-0000-0000-0000-0000000000b3';

-- categorias vêm do seed
insert into public.audit_logs (action, resource_type) values ('fixture', 'x');
insert into public.posts (id, author_id, origin, kind, status, title, content) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'OFFICIAL', 'FRASE', 'PUBLISHED', 'Oficial', 'Texto oficial'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000b1', 'COMMUNITY', 'FRASE', 'PENDING', null, 'Post da alice pendente'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000b1', 'COMMUNITY', 'FRASE', 'PUBLISHED', null, 'Post da alice publicado');

-- 1. Anônimo ---------------------------------------------------------------
select pg_temp.as_anon();
select pg_temp.assert_eq((select count(*) from public.posts)::int, 2, 'anon vê somente posts publicados');
select pg_temp.must_fail($$insert into public.posts (author_id, content) values ('00000000-0000-0000-0000-0000000000b1', 'x')$$, 'anon não insere posts');
select pg_temp.must_see_zero('public.audit_logs', 'anon não lê audit_logs');
select pg_temp.must_fail($$select * from public.rate_limits$$, 'anon não lê rate_limits');
select pg_temp.must_fail($$select public.admin_stats()$$, 'anon não chama admin_stats');
select pg_temp.must_fail($$select public.register_view('10000000-0000-0000-0000-000000000001')$$, 'anon não chama register_view');
select pg_temp.must_fail($$select public.rate_limit_hit('k', 1, 60)$$, 'anon não chama rate_limit_hit');

-- 2. Usuário comum (bob) -------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
select pg_temp.assert_eq((select count(*) from public.posts)::int, 2, 'bob não vê post pendente de outro');
-- privilege escalation
select pg_temp.must_affect_zero($$update public.profiles set role = 'ADMIN' where id = '00000000-0000-0000-0000-0000000000b1'$$, 'bob não promove alice');
update public.profiles set role = 'ADMIN' where id = '00000000-0000-0000-0000-0000000000b2';
select pg_temp.assert_eq((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'), 'USER', 'bob não se promove (trigger zera)');
update public.profiles set is_blocked = false, bio = 'oi' where id = '00000000-0000-0000-0000-0000000000b2';
select pg_temp.assert_eq((select bio from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'), 'oi', 'bob edita a própria bio');
select pg_temp.must_affect_zero($$update public.profiles set bio = 'hack' where id = '00000000-0000-0000-0000-0000000000b1'$$, 'bob não edita perfil de alice');
-- IDOR em posts
select pg_temp.must_affect_zero($$update public.posts set content = 'hack' where id = '10000000-0000-0000-0000-000000000003'$$, 'bob não edita post da alice');
select pg_temp.must_affect_zero($$delete from public.posts where id = '10000000-0000-0000-0000-000000000003'$$, 'bob não exclui post da alice');
select pg_temp.must_affect_zero($$update public.posts set content = 'hack' where id = '10000000-0000-0000-0000-000000000001'$$, 'bob não edita post oficial');
-- criação
select pg_temp.must_fail($$insert into public.posts (author_id, origin, status, content) values ('00000000-0000-0000-0000-0000000000b2', 'COMMUNITY', 'PUBLISHED', 'auto-publicado')$$, 'bob não publica direto');
select pg_temp.must_fail($$insert into public.posts (author_id, origin, status, content) values ('00000000-0000-0000-0000-0000000000b2', 'OFFICIAL', 'PENDING', 'oficial falso')$$, 'bob não cria post oficial');
select pg_temp.must_fail($$insert into public.posts (author_id, origin, status, content) values ('00000000-0000-0000-0000-0000000000b1', 'COMMUNITY', 'PENDING', 'em nome da alice')$$, 'bob não posta como alice');
insert into public.posts (id, author_id, origin, status, content, like_count, view_count) values ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000b2', 'COMMUNITY', 'PENDING', 'post do bob', 999, 999);
select pg_temp.assert_eq((select like_count + view_count from public.posts where id = '10000000-0000-0000-0000-000000000004'), 0, 'contadores forjados no insert são zerados');
update public.posts set like_count = 5000 where id = '10000000-0000-0000-0000-000000000004';
select pg_temp.assert_eq((select like_count from public.posts where id = '10000000-0000-0000-0000-000000000004'), 0, 'contadores não editáveis');
select pg_temp.must_fail($$update public.posts set status = 'PUBLISHED' where id = '10000000-0000-0000-0000-000000000004'$$, 'bob não se auto-aprova');
-- curtir / favoritar / comentar
insert into public.likes (user_id, post_id) values ('00000000-0000-0000-0000-0000000000b2', '10000000-0000-0000-0000-000000000003');
select pg_temp.must_fail($$insert into public.likes (user_id, post_id) values ('00000000-0000-0000-0000-0000000000b1', '10000000-0000-0000-0000-000000000003')$$, 'bob não curte como alice');
select pg_temp.must_fail($$insert into public.likes (user_id, post_id) values ('00000000-0000-0000-0000-0000000000b2', '10000000-0000-0000-0000-000000000002')$$, 'bob não curte post não publicado');
select pg_temp.must_fail($$insert into public.likes (user_id, post_id) values ('00000000-0000-0000-0000-0000000000b2', '10000000-0000-0000-0000-000000000003')$$, 'curtida duplicada');
insert into public.favorites (user_id, post_id) values ('00000000-0000-0000-0000-0000000000b2', '10000000-0000-0000-0000-000000000003');
insert into public.comments (id, post_id, author_id, body) values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000b2', '<script>alert(1)</script>');
select pg_temp.must_fail($$insert into public.comments (post_id, author_id, body) values ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000b1', 'falso')$$, 'bob não comenta como alice');
select pg_temp.must_fail($$update public.comments set body = 'editado' where id = '20000000-0000-0000-0000-000000000001'$$, 'corpo do comentário imutável');
select pg_temp.must_see_zero('public.audit_logs', 'bob não lê audit_logs');
select pg_temp.must_fail($$select public.log_audit('x','y')$$, 'bob não escreve audit');
select pg_temp.must_fail($$select public.admin_stats()$$, 'bob não vê estatísticas');
select pg_temp.must_affect_zero($$update public.reports set status = 'RESOLVED'$$, 'bob não resolve denúncias');
select pg_temp.must_fail($$insert into public.notifications (user_id, type) values ('00000000-0000-0000-0000-0000000000b1', 'LIKE')$$, 'bob não forja notificações');
select pg_temp.must_fail($$insert into public.categories (name, slug) values ('Hack', 'hack')$$, 'bob não cria categorias');
select pg_temp.must_fail($$insert into public.media (owner_id, bucket, path, mime_type, size_bytes) values ('00000000-0000-0000-0000-0000000000b2', 'admin', '00000000-0000-0000-0000-0000000000b2/x.png', 'image/png', 10)$$, 'bob não registra mídia admin');
select pg_temp.must_fail($$insert into storage.objects (bucket_id, name) values ('admin', 'x/y.png')$$, 'bob não escreve no bucket admin');
select pg_temp.must_fail($$insert into storage.objects (bucket_id, name) values ('avatars', '00000000-0000-0000-0000-0000000000b1/y.png')$$, 'bob não escreve na pasta da alice');
insert into storage.objects (bucket_id, name) values ('avatars', '00000000-0000-0000-0000-0000000000b2/y.png');
-- denúncia
insert into public.reports (reporter_id, target_type, post_id, reason) values ('00000000-0000-0000-0000-0000000000b2', 'POST', '10000000-0000-0000-0000-000000000003', 'SPAM');
select pg_temp.must_fail($$insert into public.reports (reporter_id, target_type, post_id, reason) values ('00000000-0000-0000-0000-0000000000b2', 'POST', '10000000-0000-0000-0000-000000000003', 'SPAM')$$, 'denúncia duplicada');
select pg_temp.must_fail($$insert into public.follows (follower_id, following_id) values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b2')$$, 'não segue a si mesmo');
insert into public.follows (follower_id, following_id) values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b1');

-- 3. Alice: notificações e edição do próprio post -----------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
select pg_temp.assert_eq((select count(*) from public.notifications)::int, 3, 'alice recebeu LIKE, COMMENT e FOLLOW');
select pg_temp.assert_eq((select like_count from public.posts where id = '10000000-0000-0000-0000-000000000003'), 1, 'contador de curtidas');
select pg_temp.assert_eq((select comment_count from public.posts where id = '10000000-0000-0000-0000-000000000003'), 1, 'contador de comentários');
select pg_temp.assert_eq((select count(*) from public.favorites)::int, 0, 'alice não vê favoritos do bob');
update public.posts set content = 'editado pela alice' where id = '10000000-0000-0000-0000-000000000003';
select pg_temp.assert_eq((select status::text from public.posts where id = '10000000-0000-0000-0000-000000000003'), 'PENDING', 'editar post publicado volta para PENDING');
select pg_temp.must_fail($$update public.notifications set type = 'FOLLOW'$$, 'notificação só permite read_at');
update public.notifications set read_at = now();
delete from public.posts where id = '10000000-0000-0000-0000-000000000003';
select pg_temp.assert_eq((select count(*) from public.posts where id = '10000000-0000-0000-0000-000000000003')::int, 0, 'alice exclui o próprio post');

-- 4. Moderador ---------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b3');
select pg_temp.assert_eq((select count(*) from public.posts)::int, 3, 'moderador vê pendentes');
update public.posts set status = 'PUBLISHED' where id = '10000000-0000-0000-0000-000000000002';
select pg_temp.assert_eq((select status::text from public.posts where id = '10000000-0000-0000-0000-000000000002'), 'PUBLISHED', 'moderador aprova post da comunidade');
select pg_temp.must_affect_zero($$update public.posts set status = 'HIDDEN' where id = '10000000-0000-0000-0000-000000000001'$$, 'moderador não altera post oficial');
update public.profiles set role = 'ADMIN' where id = '00000000-0000-0000-0000-0000000000b3';
select pg_temp.assert_eq((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000b3'), 'MODERATOR', 'moderador não se promove');
select pg_temp.must_see_zero('public.audit_logs', 'moderador não lê audit_logs');
select pg_temp.assert_eq((public.admin_stats() ->> 'users')::int, 4, 'moderador lê estatísticas');
select public.log_audit('post.approve', 'post', '10000000-0000-0000-0000-000000000002', '{}');
update public.reports set status = 'RESOLVED', resolved_by = auth.uid(), resolved_at = now();

-- 5. Admin ---------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.assert_eq((select count(*) from public.audit_logs)::int, 2, 'admin lê audit_logs');
insert into public.posts (author_id, origin, kind, status, title, content) values ('00000000-0000-0000-0000-00000000000a', 'OFFICIAL', 'POEMA', 'PUBLISHED', 'Novo', 'Verso');
update public.profiles set role = 'MODERATOR' where id = '00000000-0000-0000-0000-0000000000b2';
select pg_temp.assert_eq((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'), 'MODERATOR', 'admin altera role de outro');
update public.profiles set role = 'USER' where id = '00000000-0000-0000-0000-00000000000a';
select pg_temp.assert_eq((select role::text from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'ADMIN', 'admin não rebaixa a si mesmo');
select pg_temp.must_fail($$update public.audit_logs set action = 'x'$$, 'audit_logs é imutável');
select pg_temp.must_fail($$delete from public.audit_logs$$, 'audit_logs não pode ser apagado');
select pg_temp.must_fail($$insert into public.audit_logs (admin_id, action, resource_type) values (null, 'forjado', 'x')$$, 'audit_logs sem INSERT direto');

-- 6. Admin com MFA verificado em AAL1 perde poderes -----------------------------------------
select pg_temp.as_su();
insert into auth.mfa_factors (user_id, status) values ('00000000-0000-0000-0000-00000000000a', 'verified');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'aal1');
select pg_temp.assert_eq(public.is_admin(), false, 'admin com MFA e sessão AAL1 não é admin');
select pg_temp.must_see_zero('public.audit_logs', 'AAL1 não lê audit_logs');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'aal2');
select pg_temp.assert_eq(public.is_admin(), true, 'AAL2 restaura admin');

-- 7c. CRIADOR ---------------------------------------------------------------------------------
select pg_temp.as_su();
insert into auth.users (id, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000c0', '{"username":"criador","role":"CREATOR"}');
select pg_temp.assert_eq((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000c0'), 'USER', 'metadata não concede CRIADOR');
update public.profiles set role = 'CREATOR' where id = '00000000-0000-0000-0000-0000000000c0';
update public.profiles set role = 'ADMIN' where id = '00000000-0000-0000-0000-0000000000b2';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c0');
select pg_temp.assert_eq(public.is_admin(), true, 'criador tem poderes de admin');
select pg_temp.assert_eq(public.is_staff(), true, 'criador é staff');
select pg_temp.assert_eq(public.is_creator(), true, 'criador é criador');
select pg_temp.assert_eq((select count(*) from public.audit_logs)::int >= 1, true, 'criador lê audit_logs');
update public.profiles set role = 'USER' where id = '00000000-0000-0000-0000-0000000000b2';
select pg_temp.assert_eq((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'), 'USER', 'criador rebaixa admin');
update public.profiles set role = 'CREATOR' where id = '00000000-0000-0000-0000-0000000000b1';
select pg_temp.assert_eq((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'), 'USER', 'criador não cria outro criador');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
update public.profiles set role = 'USER' where id = '00000000-0000-0000-0000-0000000000c0';
select pg_temp.assert_eq((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000c0'), 'CREATOR', 'admin não rebaixa o criador');
update public.profiles set role = 'CREATOR' where id = '00000000-0000-0000-0000-0000000000b1';
select pg_temp.assert_eq((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'), 'USER', 'admin não cria criador');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
select pg_temp.assert_eq(public.is_admin(), false, 'usuário comum não é admin');

-- 7. Usuário bloqueado -----------------------------------------------------------------------
select pg_temp.as_su();
update public.profiles set is_blocked = true where id = '00000000-0000-0000-0000-0000000000b2';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
select pg_temp.must_fail($$insert into public.comments (post_id, author_id, body) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b2', 'x')$$, 'bloqueado não comenta');
select pg_temp.must_fail($$insert into public.posts (author_id, origin, status, content) values ('00000000-0000-0000-0000-0000000000b2', 'COMMUNITY', 'PENDING', 'x')$$, 'bloqueado não publica');
select pg_temp.assert_eq(public.is_staff(), false, 'moderador bloqueado perde poderes');
select pg_temp.as_anon();
select pg_temp.assert_eq((select count(*) from public.profiles where id = '00000000-0000-0000-0000-0000000000b2')::int, 0, 'perfil bloqueado oculto ao público');

-- 7b. Nomes de FK usados nos embeds do PostgREST (src/lib/data.ts e páginas admin)
select pg_temp.assert_eq((select count(*) from pg_constraint where conname in (
  'posts_author_id_fkey','comments_author_id_fkey','notifications_actor_id_fkey',
  'reports_reporter_id_fkey','reports_profile_id_fkey','audit_logs_admin_id_fkey'))::int, 6, 'FKs usadas nos embeds existem');

-- 8. Rate limit (service_role) ----------------------------------------------------------------
select pg_temp.as_su();
set local role service_role;
select pg_temp.assert_eq(public.rate_limit_hit('t:1', 2, 60), true, 'rate 1');
select pg_temp.assert_eq(public.rate_limit_hit('t:1', 2, 60), true, 'rate 2');
select pg_temp.assert_eq(public.rate_limit_hit('t:1', 2, 60), false, 'rate 3 bloqueado');

rollback;
\echo 'TODOS OS TESTES RLS PASSARAM'

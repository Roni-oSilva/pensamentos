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
-- criação (com a publicação direta DESLIGADA: tudo passa por aprovação)
select pg_temp.as_su();
insert into public.site_settings (key, value) values ('community_autopublish', 'false'::jsonb) on conflict (key) do update set value = excluded.value;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
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
select pg_temp.must_fail($$update public.comments set status = 'HIDDEN' where id = '20000000-0000-0000-0000-000000000001'$$, 'autor não oculta o próprio comentário (só a equipe)');
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

-- 7d. Feedback (ajuda/sugestões) ---------------------------------------------------------------
select pg_temp.as_su();
insert into public.feedback (kind, message) values ('SUGGESTION', 'Coloquem um modo claro, por favor');
select pg_temp.as_anon();
select pg_temp.must_fail($$insert into public.feedback (kind, message) values ('HELP', 'tentativa anonima')$$, 'anônimo não grava feedback direto');
select pg_temp.must_see_zero('public.feedback', 'anônimo não lê feedback');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
select pg_temp.must_fail($$insert into public.feedback (kind, message) values ('HELP', 'tentativa de usuario')$$, 'usuário comum não grava feedback direto');
select pg_temp.must_see_zero('public.feedback', 'usuário comum não lê feedback');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'aal2'); -- o admin do teste tem 2FA verificado
select pg_temp.assert_eq((select count(*) from public.feedback)::int, 1, 'admin lê feedback');
update public.feedback set status = 'DONE';
select pg_temp.assert_eq((select status from public.feedback limit 1), 'DONE', 'admin atualiza status do feedback');

-- 7e. Fórum, votações e edição de comentários --------------------------------------------------
select pg_temp.as_su();
insert into public.comments (id, post_id, author_id, body) values ('20000000-0000-0000-0000-0000000000e1', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1', 'texto original');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
select pg_temp.must_affect_zero($$update public.comments set body = 'invadido' where id = '20000000-0000-0000-0000-0000000000e1'$$, 'outro usuário não edita comentário alheio');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
update public.comments set body = 'texto ajustado' where id = '20000000-0000-0000-0000-0000000000e1';
select pg_temp.assert_eq((select body from public.comments where id = '20000000-0000-0000-0000-0000000000e1'), 'texto ajustado', 'autor edita o próprio comentário');
select pg_temp.assert_eq((select edited_at is not null from public.comments where id = '20000000-0000-0000-0000-0000000000e1'), true, 'edição marca edited_at');
select pg_temp.must_fail($$update public.comments set status = 'HIDDEN' where id = '20000000-0000-0000-0000-0000000000e1'$$, 'autor não muda o status do próprio comentário');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'aal2');
select pg_temp.must_fail($$update public.comments set body = 'moderador reescreve' where id = '20000000-0000-0000-0000-0000000000e1'$$, 'staff não reescreve o texto de outro');
update public.comments set status = 'HIDDEN' where id = '20000000-0000-0000-0000-0000000000e1';
select pg_temp.as_su();
delete from public.comments where id = '20000000-0000-0000-0000-0000000000e1';

-- discussões
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
insert into public.forum_threads (id, author_id, title, body) values ('30000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b1', 'As pessoas mudam?', 'O que vocês acham?');
select pg_temp.must_fail($$insert into public.forum_threads (author_id, title, body) values ('00000000-0000-0000-0000-0000000000b2', 'Em nome de outro', 'x')$$, 'não cria discussão em nome de outro');
select pg_temp.must_fail($$update public.forum_threads set reply_count = 999 where id = '30000000-0000-0000-0000-0000000000f1'$$, 'contador de respostas é protegido');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
insert into public.forum_replies (thread_id, author_id, body) values ('30000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b2', 'Acredito que sim');
insert into public.forum_votes (thread_id, user_id, value) values ('30000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b2', 1);
select pg_temp.assert_eq((select reply_count from public.forum_threads), 1, 'conta respostas');
select pg_temp.assert_eq((select up_count from public.forum_threads), 1, 'conta 👍');
update public.forum_votes set value = -1 where thread_id = '30000000-0000-0000-0000-0000000000f1';
select pg_temp.assert_eq((select up_count * 10 + down_count from public.forum_threads), 1, 'trocar o voto move a contagem');
select pg_temp.must_affect_zero($$update public.forum_threads set body = 'editado por outro' where id = '30000000-0000-0000-0000-0000000000f1'$$, 'outro usuário não edita a discussão');
select pg_temp.as_anon();
select pg_temp.assert_eq((select count(*) from public.forum_threads)::int, 1, 'anônimo lê discussões');
select pg_temp.must_see_zero('public.forum_votes', 'anônimo não vê votos');

-- votações: só o Criador abre
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
select pg_temp.must_fail($$insert into public.polls (creator_id, question) values ('00000000-0000-0000-0000-0000000000b1', 'Posso criar votação?')$$, 'membro não abre votação');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'aal2');
select pg_temp.must_fail($$insert into public.polls (creator_id, question) values ('00000000-0000-0000-0000-00000000000a', 'Admin cria votação?')$$, 'admin também não abre votação');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c0');
insert into public.polls (id, creator_id, question) values ('40000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c0', 'Qual horário de oração?');
insert into public.poll_options (id, poll_id, label, position) values ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-0000000000a1', 'Manhã', 0), ('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-0000000000a1', 'Noite', 1);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
insert into public.poll_votes (poll_id, user_id, option_id) values ('40000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '41000000-0000-0000-0000-000000000001');
select pg_temp.must_fail($$insert into public.poll_votes (poll_id, user_id, option_id) values ('40000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '41000000-0000-0000-0000-000000000002')$$, 'um voto por pessoa');
update public.poll_votes set option_id = '41000000-0000-0000-0000-000000000002';
select pg_temp.assert_eq((select vote_count from public.poll_options where label = 'Noite'), 1, 'trocar voto move a contagem da enquete');
select pg_temp.assert_eq((select vote_count from public.poll_options where label = 'Manhã'), 0, 'opção antiga perde o voto');
select pg_temp.must_affect_zero($$update public.poll_options set vote_count = 100$$, 'contagem da enquete é protegida');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c0');
update public.polls set status = 'CLOSED';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
select pg_temp.must_fail($$insert into public.poll_votes (poll_id, user_id, option_id) values ('40000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b2', '41000000-0000-0000-0000-000000000001')$$, 'votação encerrada não recebe votos');
select pg_temp.as_su();

-- 7f. Área de Estudo ----------------------------------------------------------------------------
select pg_temp.as_su();
insert into public.study_progress (user_id, track_slug, lesson_order, quiz_correct, quiz_total) values ('00000000-0000-0000-0000-0000000000b1', 'fundamentos-da-fe', 1, 2, 2);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
select pg_temp.assert_eq((select count(*) from public.study_progress)::int, 1, 'membro vê o próprio progresso');
select pg_temp.must_fail($$insert into public.study_progress (user_id, track_slug, lesson_order) values ('00000000-0000-0000-0000-0000000000b1', 'fundamentos-da-fe', 2)$$, 'membro não grava progresso direto (XP só pelo servidor)');
select pg_temp.must_fail($$insert into public.study_plan_days (user_id, day) values ('00000000-0000-0000-0000-0000000000b1', 1)$$, 'membro não grava dia do plano direto');
select pg_temp.must_fail($$insert into public.study_trail_done (user_id, track_slug) values ('00000000-0000-0000-0000-0000000000b1', 'fundamentos-da-fe')$$, 'membro não marca trilha concluída direto');
insert into public.study_notes (user_id, track_slug, lesson_order, body) values ('00000000-0000-0000-0000-0000000000b1', 'fundamentos-da-fe', 1, 'minha anotação');
update public.study_notes set body = 'anotação editada' where user_id = '00000000-0000-0000-0000-0000000000b1';
select pg_temp.assert_eq((select body from public.study_notes), 'anotação editada', 'dono edita a anotação');
select pg_temp.must_fail($$insert into public.study_notes (user_id, track_slug, lesson_order, body) values ('00000000-0000-0000-0000-0000000000b2', 'fundamentos-da-fe', 1, 'em nome de outro')$$, 'não anota em nome de outro');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
select pg_temp.must_see_zero('public.study_progress', 'outro membro não vê o progresso alheio');
select pg_temp.must_see_zero('public.study_notes', 'outro membro não vê as anotações alheias');
select pg_temp.as_anon();
select pg_temp.must_see_zero('public.study_notes', 'anônimo não vê anotações');
select pg_temp.as_su();

-- 7g. Bíblia em um ano --------------------------------------------------------------------------
select pg_temp.as_su();
update public.bible_plan_settings set start_date = (now() at time zone 'America/Sao_Paulo')::date - 9; -- hoje = dia 10
select pg_temp.assert_eq(public.bible_plan_current_day(), 10, 'dia atual do plano');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'aal2');
select pg_temp.must_affect_zero($$update public.bible_plan_settings set start_date = '2020-01-01'$$, 'admin não altera o plano');
select pg_temp.must_fail($$insert into public.bible_plan_notes (day, note) values (1, 'nota do admin')$$, 'admin não escreve nota do plano');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
select pg_temp.must_affect_zero($$update public.bible_plan_settings set show_presence = false$$, 'membro não altera o plano');
insert into public.bible_plan_marks (user_id, day) values ('00000000-0000-0000-0000-0000000000b1', 10);
insert into public.bible_plan_marks (user_id, day) values ('00000000-0000-0000-0000-0000000000b1', 3);
select pg_temp.must_fail($$insert into public.bible_plan_marks (user_id, day) values ('00000000-0000-0000-0000-0000000000b1', 11)$$, 'não marca dia futuro');
select pg_temp.must_fail($$insert into public.bible_plan_marks (user_id, day) values ('00000000-0000-0000-0000-0000000000b2', 10)$$, 'não marca em nome de outro');
select pg_temp.must_fail($$update public.bible_plan_marks set day = 1$$, 'marcação não é editável');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c0');
update public.bible_plan_settings set message = 'Vamos juntos!';
insert into public.bible_plan_notes (day, note) values (10, 'Hoje começamos Êxodo');
select pg_temp.assert_eq((select message from public.bible_plan_settings), 'Vamos juntos!', 'criador altera o plano');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
select pg_temp.assert_eq((select count(*) from public.bible_plan_marks where day = 10)::int, 1, 'membro vê a lista de presença aberta');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c0');
update public.bible_plan_settings set show_presence = false;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
select pg_temp.must_see_zero('public.bible_plan_marks', 'lista fechada: membro não vê os outros');
select pg_temp.as_anon();
select pg_temp.must_see_zero('public.bible_plan_marks', 'anônimo não vê a lista de presença');
select pg_temp.assert_eq((select total from public.bible_plan_counts() where day = 10), 1, 'contagem do dia é pública');
select pg_temp.assert_eq((select note from public.bible_plan_notes where day = 10), 'Hoje começamos Êxodo', 'notas do plano são públicas');
select pg_temp.must_fail($$insert into public.bible_plan_marks (user_id, day) values ('00000000-0000-0000-0000-0000000000b1', 1)$$, 'anônimo não marca');
select pg_temp.as_su();

-- 7h. Ranking de XP e nível público ----------------------------------------------------------
select pg_temp.as_su();
-- b1: aula com quiz perfeito do bloco 7f (30) + trilha (100) + 2 dias da Bíblia do bloco 7g (10) = 140
insert into public.study_trail_done (user_id, track_slug) values ('00000000-0000-0000-0000-0000000000b1', 'fundamentos-da-fe');
-- b2: uma aula antiga, com quiz incompleto (20), feita há 2 meses
insert into public.study_progress (user_id, track_slug, lesson_order, quiz_correct, quiz_total, completed_at) values ('00000000-0000-0000-0000-0000000000b2', 'fundamentos-da-fe', 1, 1, 3, now() - interval '62 days');
select pg_temp.as_anon();
select pg_temp.must_see_zero('public.study_progress', 'anônimo não lê o progresso dos outros');
select pg_temp.must_fail($$select * from public.study_xp_rows(null)$$, 'soma interna não é pública');
select pg_temp.assert_eq((select xp from public.study_ranking('all') where user_id = '00000000-0000-0000-0000-0000000000b1'), 140, 'XP no ranking segue a regra do app');
select pg_temp.assert_eq((select pos from public.study_ranking('all') where user_id = '00000000-0000-0000-0000-0000000000b1')::int, 1, 'primeiro lugar no ranking geral');
select pg_temp.assert_eq((select perfect::text || '/' || trails || '/' || bible_days || '/' || lessons from public.study_ranking('all') where user_id = '00000000-0000-0000-0000-0000000000b1'), '1/1/2/1', 'ranking detalha quiz perfeito, trilhas, Bíblia e aulas');
select pg_temp.assert_eq((select pos from public.study_ranking('all') where user_id = '00000000-0000-0000-0000-0000000000b2')::int, 2, 'segundo lugar no ranking geral');
select pg_temp.assert_eq((select count(*) from public.study_ranking('month') where user_id = '00000000-0000-0000-0000-0000000000b2')::int, 0, 'ranking do mês ignora o que é antigo');
select pg_temp.assert_eq((select pos from public.study_public_level('00000000-0000-0000-0000-0000000000b2'))::int, 2, 'nível público mostra a posição');
select pg_temp.assert_eq((select xp from public.study_public_level('00000000-0000-0000-0000-0000000000b2')), 20, 'nível público mostra o XP');
select pg_temp.as_su();
insert into public.study_progress (user_id, track_slug, lesson_order, quiz_correct, quiz_total) values ('00000000-0000-0000-0000-00000000000a', 'fundamentos-da-fe', 1, 3, 3);
select pg_temp.as_anon();
select pg_temp.assert_eq((select count(*) from public.study_ranking('all') where user_id = '00000000-0000-0000-0000-00000000000a')::int, 0, 'equipe não entra no ranking');
select pg_temp.assert_eq((select xp from public.study_public_level('00000000-0000-0000-0000-00000000000a')), 30, 'equipe tem nível público');
select pg_temp.assert_eq((select pos from public.study_public_level('00000000-0000-0000-0000-00000000000a')) is null, true, 'equipe fica sem posição');
select pg_temp.as_su();
update public.profiles set is_blocked = true where id = '00000000-0000-0000-0000-0000000000b1';
select pg_temp.as_anon();
select pg_temp.assert_eq((select count(*) from public.study_ranking('all') where user_id = '00000000-0000-0000-0000-0000000000b1')::int, 0, 'bloqueado sai do ranking');
select pg_temp.assert_eq((select pos from public.study_ranking('all') where user_id = '00000000-0000-0000-0000-0000000000b2')::int, 1, 'ranking recalcula sem o bloqueado');
select pg_temp.as_su();
update public.profiles set is_blocked = false where id = '00000000-0000-0000-0000-0000000000b1';

-- 7i. Publicação direta na comunidade ----------------------------------------------------------
select pg_temp.as_su();
update public.site_settings set value = 'true'::jsonb where key = 'community_autopublish';
update public.posts set status = 'HIDDEN' where id = '10000000-0000-0000-0000-000000000004';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
insert into public.posts (id, author_id, origin, status, content) values ('10000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-0000000000b1', 'COMMUNITY', 'PUBLISHED', 'publicado na hora');
select pg_temp.assert_eq((select published_at is not null from public.posts where id = '10000000-0000-0000-0000-000000000099'), true, 'membro publica direto e ganha data de publicação');
update public.posts set content = 'editado' where id = '10000000-0000-0000-0000-000000000099';
select pg_temp.assert_eq((select status::text from public.posts where id = '10000000-0000-0000-0000-000000000099'), 'PUBLISHED', 'editar mantém publicado');
select pg_temp.must_fail($$insert into public.posts (author_id, origin, status, content) values ('00000000-0000-0000-0000-0000000000b1', 'OFFICIAL', 'PUBLISHED', 'oficial falso')$$, 'membro continua sem criar post oficial');
select pg_temp.must_fail($$insert into public.posts (author_id, origin, status, content) values ('00000000-0000-0000-0000-0000000000b2', 'COMMUNITY', 'PUBLISHED', 'em nome de outro')$$, 'não publica em nome de outro');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
select pg_temp.must_affect_zero($$update public.posts set status = 'PUBLISHED' where id = '10000000-0000-0000-0000-000000000004'$$, 'post ocultado pela equipe não volta sozinho');
select pg_temp.as_anon();
select pg_temp.assert_eq((select count(*) from public.posts where id = '10000000-0000-0000-0000-000000000099')::int, 1, 'publicação direta aparece para todos');
select pg_temp.as_su();

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

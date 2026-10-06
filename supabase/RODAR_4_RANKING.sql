-- RANKING DOS ESTUDOS + XP MÁXIMO PARA O CRIADOR
-- Cole tudo no SQL Editor do Supabase e clique em Run. Pode rodar mais de uma vez.

-- ========== 1) Ranking e nível público (migração 0012) ==========
-- Ranking de quem mais aprende (XP) e nível público no perfil.
-- O XP continua sendo calculado a partir dos registros (nada é guardado à parte), com a MESMA regra de
-- src/lib/study/xp.ts:  XP: aula=20 quiz_perfeito=10 trilha=100 dia_do_plano=5 dia_da_biblia=5
-- As tabelas de progresso continuam privadas (cada um só lê as suas); estas funções expõem apenas os totais.
-- Pode ser rodado mais de uma vez.

-- Soma por pessoa (interna: não é exposta diretamente). since = null → desde sempre.
create or replace function public.study_xp_rows(since timestamptz default null)
returns table (user_id uuid, xp integer, lessons integer, trails integer)
language sql stable security definer set search_path = public
as $$
  with ev as (
    select sp.user_id, 20 + case when sp.quiz_total > 0 and sp.quiz_correct = sp.quiz_total then 10 else 0 end as xp, 1 as lesson, 0 as trail
      from public.study_progress sp where since is null or sp.completed_at >= since
    union all
    select td.user_id, 100, 0, 1 from public.study_trail_done td where since is null or td.completed_at >= since
    union all
    select pd.user_id, 5, 0, 0 from public.study_plan_days pd where since is null or pd.read_at >= since
    union all
    select bm.user_id, 5, 0, 0 from public.bible_plan_marks bm where since is null or bm.marked_at >= since
  )
  select ev.user_id, sum(ev.xp)::integer, sum(ev.lesson)::integer, sum(ev.trail)::integer from ev group by ev.user_id
$$;
revoke all on function public.study_xp_rows(timestamptz) from public, anon, authenticated;

-- Início do mês atual no horário de Brasília.
create or replace function public.study_month_start()
returns timestamptz language sql stable set search_path = public
as $$ select (date_trunc('month', now() at time zone 'America/Sao_Paulo')) at time zone 'America/Sao_Paulo' $$;

-- Ranking público: period = 'all' (geral) ou 'month' (este mês).
-- Só membros (role USER): a equipe (moderadores, administradores e o Criador) não entra; perfis bloqueados também não.
drop function if exists public.study_ranking(text, integer);
create or replace function public.study_ranking(period text default 'all', lim integer default 50)
returns table (pos bigint, user_id uuid, username text, display_name text, avatar_url text, xp integer, lessons integer, trails integer)
language sql stable security definer set search_path = public
as $$
  select rank() over (order by r.xp desc) as pos, p.id, p.username, p.display_name, p.avatar_url, r.xp, r.lessons, r.trails
    from public.study_xp_rows(case when period = 'month' then public.study_month_start() else null end) r
    join public.profiles p on p.id = r.user_id
   where not p.is_blocked and p.role = 'USER' and r.xp > 0
   order by r.xp desc, p.username
   limit least(greatest(coalesce(lim, 50), 1), 100)
$$;

-- Nível público de uma pessoa (para o perfil) e a posição dela no ranking geral (null para a equipe).
drop function if exists public.study_public_level(uuid);
create or replace function public.study_public_level(uid uuid)
returns table (xp integer, lessons integer, trails integer, pos bigint, ranked bigint, in_ranking boolean)
language sql stable security definer set search_path = public
as $$
  with all_rows as (
    select r.* from public.study_xp_rows(null) r join public.profiles p on p.id = r.user_id where not p.is_blocked and p.role = 'USER' and r.xp > 0
  ), mine as (
    select r.* from public.study_xp_rows(null) r where r.user_id = uid
  ), me as (
    select coalesce((select m.xp from mine m), 0) as xp,
           coalesce((select m.lessons from mine m), 0) as lessons,
           coalesce((select m.trails from mine m), 0) as trails,
           (select p.role = 'USER' from public.profiles p where p.id = uid) as member
  )
  select me.xp, me.lessons, me.trails,
         case when me.member and me.xp > 0 then (select count(*) from all_rows a where a.xp > me.xp) + 1 else null end,
         (select count(*) from all_rows),
         me.member
    from me
   where exists (select 1 from public.profiles p where p.id = uid and not p.is_blocked)
$$;

revoke all on function public.study_ranking(text, integer) from public;
revoke all on function public.study_public_level(uuid) from public;
revoke all on function public.study_month_start() from public;
grant execute on function public.study_ranking(text, integer) to anon, authenticated;
grant execute on function public.study_public_level(uuid) to anon, authenticated;
grant execute on function public.study_month_start() to anon, authenticated;

-- consultas do ranking por período
create index if not exists study_progress_completed_idx on public.study_progress (completed_at);
create index if not exists bible_plan_marks_marked_idx on public.bible_plan_marks (marked_at);


-- ========== 2) Conta do Criador com todas as aulas e trilhas concluídas ==========
-- 41 aulas com quiz perfeito + 5 trilhas. A equipe não entra no ranking; o nível aparece no perfil.
insert into public.study_progress (user_id, track_slug, lesson_order, quiz_correct, quiz_total)
select p.id, v.slug, v.ord, v.q, v.q
  from public.profiles p
 cross join (values
  ('fundamentos-da-fe', 1, 3),
  ('fundamentos-da-fe', 2, 3),
  ('fundamentos-da-fe', 3, 3),
  ('fundamentos-da-fe', 4, 3),
  ('fundamentos-da-fe', 5, 3),
  ('fundamentos-da-fe', 6, 3),
  ('fundamentos-da-fe', 7, 3),
  ('fundamentos-da-fe', 8, 3),
  ('evangelho-de-joao', 1, 3),
  ('evangelho-de-joao', 2, 3),
  ('evangelho-de-joao', 3, 3),
  ('evangelho-de-joao', 4, 3),
  ('evangelho-de-joao', 5, 3),
  ('evangelho-de-joao', 6, 3),
  ('evangelho-de-joao', 7, 3),
  ('evangelho-de-joao', 8, 3),
  ('evangelho-de-joao', 9, 3),
  ('evangelho-de-joao', 10, 3),
  ('evangelho-de-joao', 11, 3),
  ('evangelho-de-joao', 12, 3),
  ('a-vida-de-oracao', 1, 3),
  ('a-vida-de-oracao', 2, 3),
  ('a-vida-de-oracao', 3, 3),
  ('a-vida-de-oracao', 4, 3),
  ('a-vida-de-oracao', 5, 3),
  ('avivamentos-e-avivalistas', 1, 3),
  ('avivamentos-e-avivalistas', 2, 3),
  ('avivamentos-e-avivalistas', 3, 3),
  ('avivamentos-e-avivalistas', 4, 3),
  ('avivamentos-e-avivalistas', 5, 3),
  ('avivamentos-e-avivalistas', 6, 3),
  ('avivamentos-e-avivalistas', 7, 3),
  ('avivamentos-e-avivalistas', 8, 3),
  ('avivamentos-e-avivalistas', 9, 3),
  ('intimidade-com-deus', 1, 3),
  ('intimidade-com-deus', 2, 3),
  ('intimidade-com-deus', 3, 3),
  ('intimidade-com-deus', 4, 3),
  ('intimidade-com-deus', 5, 3),
  ('intimidade-com-deus', 6, 3),
  ('intimidade-com-deus', 7, 3)
 ) as v(slug, ord, q)
 where p.role = 'CREATOR'
on conflict (user_id, track_slug, lesson_order) do update set quiz_correct = excluded.quiz_total, quiz_total = excluded.quiz_total;

insert into public.study_trail_done (user_id, track_slug)
select p.id, t from public.profiles p cross join unnest(array['fundamentos-da-fe', 'evangelho-de-joao', 'a-vida-de-oracao', 'avivamentos-e-avivalistas', 'intimidade-com-deus']) as t
 where p.role = 'CREATOR'
on conflict (user_id, track_slug) do nothing;

-- Conferência: deve mostrar o seu usuário com o XP total, nível Árvore e "in_ranking = false".
select p.username, l.xp, l.lessons, l.trails, l.in_ranking
  from public.profiles p, lateral public.study_public_level(p.id) l
 where p.role = 'CREATOR';

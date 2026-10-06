-- Ranking de quem mais aprende (XP) e nível público no perfil.
-- O XP continua sendo calculado a partir dos registros (nada é guardado à parte), com a MESMA regra de
-- src/lib/study/xp.ts:  XP: aula=20 quiz_perfeito=10 trilha=100 dia_do_plano=5 dia_da_biblia=5
-- As tabelas de progresso continuam privadas (cada um só lê as suas); estas funções expõem apenas os totais.
-- Pode ser rodado mais de uma vez.

-- Soma por pessoa, com o detalhamento (interna: não é exposta diretamente). since = null → desde sempre.
drop function if exists public.study_xp_rows(timestamptz);
create or replace function public.study_xp_rows(since timestamptz default null)
returns table (user_id uuid, xp integer, lessons integer, perfect integer, trails integer, plan_days integer, bible_days integer, last_at timestamptz)
language sql stable security definer set search_path = public
as $$
  with ev as (
    select sp.user_id, 20 + case when sp.quiz_total > 0 and sp.quiz_correct = sp.quiz_total then 10 else 0 end as xp,
           1 as lesson, case when sp.quiz_total > 0 and sp.quiz_correct = sp.quiz_total then 1 else 0 end as perfect, 0 as trail, 0 as plan, 0 as bible, sp.completed_at as at
      from public.study_progress sp where since is null or sp.completed_at >= since
    union all
    select td.user_id, 100, 0, 0, 1, 0, 0, td.completed_at from public.study_trail_done td where since is null or td.completed_at >= since
    union all
    select pd.user_id, 5, 0, 0, 0, 1, 0, pd.read_at from public.study_plan_days pd where since is null or pd.read_at >= since
    union all
    select bm.user_id, 5, 0, 0, 0, 0, 1, bm.marked_at from public.bible_plan_marks bm where since is null or bm.marked_at >= since
  )
  select ev.user_id, sum(ev.xp)::integer, sum(ev.lesson)::integer, sum(ev.perfect)::integer, sum(ev.trail)::integer,
         sum(ev.plan)::integer, sum(ev.bible)::integer, max(ev.at)
    from ev group by ev.user_id
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
returns table (pos bigint, user_id uuid, username text, display_name text, avatar_url text, bio text, member_since timestamptz,
               xp integer, lessons integer, perfect integer, trails integer, plan_days integer, bible_days integer, last_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select rank() over (order by r.xp desc) as pos, p.id, p.username, p.display_name, p.avatar_url, p.bio, p.created_at,
         r.xp, r.lessons, r.perfect, r.trails, r.plan_days, r.bible_days, r.last_at
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

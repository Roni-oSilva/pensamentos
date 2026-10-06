-- Bíblia em um ano — versão que pode ser rodada QUANTAS VEZES quiser (não dá "already exists").
-- Cole tudo no SQL Editor do Supabase e clique em Run.

create table if not exists public.bible_plan_settings (
  id            boolean primary key default true check (id),
  start_date    date not null,
  show_presence boolean not null default true,
  message       text check (message is null or char_length(message) <= 500),
  updated_at    timestamptz not null default now()
);
insert into public.bible_plan_settings (start_date)
select date_trunc('year', now() at time zone 'America/Sao_Paulo')::date
where not exists (select 1 from public.bible_plan_settings);

create table if not exists public.bible_plan_notes (
  day        smallint primary key check (day between 1 and 365),
  note       text not null check (char_length(note) between 1 and 500),
  updated_at timestamptz not null default now()
);

create table if not exists public.bible_plan_marks (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  day       smallint not null check (day between 1 and 365),
  marked_at timestamptz not null default now(),
  primary key (user_id, day)
);
create index if not exists bible_plan_marks_day_idx on public.bible_plan_marks (day, marked_at);

create or replace function public.bible_plan_current_day()
returns integer language sql stable security definer set search_path = public
as $$ select ((now() at time zone 'America/Sao_Paulo')::date - start_date + 1)::integer from public.bible_plan_settings limit 1 $$;

create or replace function public.bible_presence_visible()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select show_presence from public.bible_plan_settings limit 1), true) $$;

create or replace function public.bible_plan_counts()
returns table (day smallint, total integer) language sql stable security definer set search_path = public
as $$
  select m.day, count(*)::integer from public.bible_plan_marks m
  where not public.is_user_blocked(m.user_id)
  group by m.day
$$;

revoke all on function public.bible_plan_current_day() from public;
revoke all on function public.bible_presence_visible() from public;
revoke all on function public.bible_plan_counts() from public;
grant execute on function public.bible_plan_current_day() to anon, authenticated;
grant execute on function public.bible_presence_visible() to anon, authenticated;
grant execute on function public.bible_plan_counts() to anon, authenticated;

alter table public.bible_plan_settings enable row level security;
alter table public.bible_plan_notes enable row level security;
alter table public.bible_plan_marks enable row level security;

drop policy if exists bible_settings_select on public.bible_plan_settings;
drop policy if exists bible_settings_update on public.bible_plan_settings;
create policy bible_settings_select on public.bible_plan_settings for select using (true);
create policy bible_settings_update on public.bible_plan_settings for update to authenticated
  using ((select public.is_creator())) with check ((select public.is_creator()));
revoke insert, update, delete on public.bible_plan_settings from anon, authenticated;
grant update (start_date, show_presence, message, updated_at) on public.bible_plan_settings to authenticated;

drop policy if exists bible_notes_select on public.bible_plan_notes;
drop policy if exists bible_notes_insert on public.bible_plan_notes;
drop policy if exists bible_notes_update on public.bible_plan_notes;
drop policy if exists bible_notes_delete on public.bible_plan_notes;
create policy bible_notes_select on public.bible_plan_notes for select using (true);
create policy bible_notes_insert on public.bible_plan_notes for insert to authenticated with check ((select public.is_creator()));
create policy bible_notes_update on public.bible_plan_notes for update to authenticated using ((select public.is_creator())) with check ((select public.is_creator()));
create policy bible_notes_delete on public.bible_plan_notes for delete to authenticated using ((select public.is_creator()));

drop policy if exists bible_marks_select on public.bible_plan_marks;
drop policy if exists bible_marks_insert on public.bible_plan_marks;
drop policy if exists bible_marks_delete on public.bible_plan_marks;
create policy bible_marks_select on public.bible_plan_marks for select to authenticated using (
  user_id = (select auth.uid())
  or (not public.is_user_blocked(user_id) and ((select public.bible_presence_visible()) or (select public.is_staff()))));
create policy bible_marks_insert on public.bible_plan_marks for insert to authenticated with check (
  user_id = (select auth.uid()) and (select public.can_write())
  and day <= (select public.bible_plan_current_day()));
create policy bible_marks_delete on public.bible_plan_marks for delete to authenticated using (user_id = (select auth.uid()));
revoke update on public.bible_plan_marks from anon, authenticated;

-- Conferência: deve mostrar 3 tabelas e 1 linha de configuração.
select
  (select count(*) from information_schema.tables where table_schema = 'public'
     and table_name in ('bible_plan_settings','bible_plan_notes','bible_plan_marks')) as tabelas,
  (select count(*) from public.bible_plan_settings) as configuracao;

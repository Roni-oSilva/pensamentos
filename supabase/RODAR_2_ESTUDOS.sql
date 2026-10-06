-- PARTE 2 de 2: Área de Estudo
-- Área de Estudo: progresso, níveis (XP calculado a partir destes registros) e anotações.
-- O conteúdo das aulas fica no código (content/estudos). Progresso e XP só são gravados pelo servidor
-- (service role, após validar o quiz); a pessoa só lê os próprios registros. Anotações são privadas e editáveis pelo dono.
create table public.study_progress (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  track_slug   text not null check (char_length(track_slug) between 1 and 80),
  lesson_order smallint not null check (lesson_order between 1 and 200),
  quiz_correct smallint not null default 0 check (quiz_correct between 0 and 20),
  quiz_total   smallint not null default 0 check (quiz_total between 0 and 20),
  completed_at timestamptz not null default now(),
  primary key (user_id, track_slug, lesson_order)
);
create table public.study_trail_done (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  track_slug   text not null check (char_length(track_slug) between 1 and 80),
  completed_at timestamptz not null default now(),
  primary key (user_id, track_slug)
);
create table public.study_plan_days (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day     smallint not null check (day between 1 and 30),
  read_at timestamptz not null default now(),
  primary key (user_id, day)
);
create table public.study_notes (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  track_slug   text not null check (char_length(track_slug) between 1 and 80),
  lesson_order smallint not null check (lesson_order between 1 and 200),
  body         text not null check (char_length(body) between 1 and 2000),
  updated_at   timestamptz not null default now(),
  primary key (user_id, track_slug, lesson_order)
);

alter table public.study_progress enable row level security;
alter table public.study_trail_done enable row level security;
alter table public.study_plan_days enable row level security;
alter table public.study_notes enable row level security;

create policy study_progress_select on public.study_progress for select to authenticated using (user_id = (select auth.uid()));
create policy study_trail_done_select on public.study_trail_done for select to authenticated using (user_id = (select auth.uid()));
create policy study_plan_days_select on public.study_plan_days for select to authenticated using (user_id = (select auth.uid()));
-- sem política de INSERT/UPDATE/DELETE nas três tabelas acima: só o servidor (service role) grava
revoke insert, update, delete on public.study_progress, public.study_trail_done, public.study_plan_days from authenticated, anon;

create policy study_notes_select on public.study_notes for select to authenticated using (user_id = (select auth.uid()));
create policy study_notes_insert on public.study_notes for insert to authenticated with check (user_id = (select auth.uid()) and (select public.can_write()));
create policy study_notes_update on public.study_notes for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy study_notes_delete on public.study_notes for delete to authenticated using (user_id = (select auth.uid()));
revoke update on public.study_notes from authenticated;
grant update (body, updated_at) on public.study_notes to authenticated;

-- ============ PARTE 1: Fórum, votações e edição de comentários ============
-- Fórum (discussões), votações (só o Criador abre) e edição de comentários.

-- ---------- Edição de comentários: o autor ajusta o próprio texto; a equipe só muda o status ----------
alter table public.comments add column edited_at timestamptz;

create or replace function public.guard_text_edit()
returns trigger language plpgsql security definer set search_path = public
as $$
declare changed boolean;
begin
  changed := new.body is distinct from old.body or coalesce(to_jsonb(new)->>'title', '') is distinct from coalesce(to_jsonb(old)->>'title', '');
  if auth.uid() is not null then
    if changed and old.author_id is distinct from auth.uid() then
      raise exception 'only the author can edit the text' using errcode = '42501';
    end if;
    if new.status is distinct from old.status and not public.is_staff() then
      raise exception 'only staff can change status' using errcode = '42501';
    end if;
  end if;
  new.edited_at := case when changed then now() else old.edited_at end;
  return new;
end $$;

create trigger comments_guard_edit before update on public.comments for each row execute function public.guard_text_edit();

create policy comments_update_author on public.comments for update to authenticated
  using (author_id = (select auth.uid()) and (select public.can_write()))
  with check (author_id = (select auth.uid()) and (select public.can_write()));
grant update (body, status) on public.comments to authenticated;

-- ---------- Discussões ----------
create table public.forum_threads (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 5 and 140),
  body        text not null check (char_length(body) between 1 and 4000),
  status      public.comment_status not null default 'VISIBLE',
  up_count    integer not null default 0,
  down_count  integer not null default 0,
  reply_count integer not null default 0,
  created_at  timestamptz not null default now(),
  edited_at   timestamptz
);
create index forum_threads_created_idx on public.forum_threads (created_at desc);
create index forum_threads_replies_idx on public.forum_threads (reply_count desc, created_at desc);

create table public.forum_replies (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.forum_threads (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1500),
  status     public.comment_status not null default 'VISIBLE',
  created_at timestamptz not null default now(),
  edited_at  timestamptz
);
create index forum_replies_thread_idx on public.forum_replies (thread_id, created_at);

create table public.forum_votes (
  thread_id  uuid not null references public.forum_threads (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  value      smallint not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create trigger forum_threads_guard_edit before update on public.forum_threads for each row execute function public.guard_text_edit();
create trigger forum_replies_guard_edit before update on public.forum_replies for each row execute function public.guard_text_edit();

-- Contadores mantidos por trigger (usuários não escrevem nas colunas de contagem)
create or replace function public.forum_reply_count()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then update public.forum_threads set reply_count = reply_count + 1 where id = new.thread_id;
  elsif tg_op = 'DELETE' then update public.forum_threads set reply_count = greatest(reply_count - 1, 0) where id = old.thread_id;
  end if;
  return null;
end $$;
create trigger forum_replies_count after insert or delete on public.forum_replies for each row execute function public.forum_reply_count();

create or replace function public.forum_vote_count()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.forum_threads set up_count = greatest(up_count - (old.value = 1)::int, 0), down_count = greatest(down_count - (old.value = -1)::int, 0) where id = old.thread_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.forum_threads set up_count = up_count + (new.value = 1)::int, down_count = down_count + (new.value = -1)::int where id = new.thread_id;
  end if;
  return null;
end $$;
create trigger forum_votes_count after insert or update or delete on public.forum_votes for each row execute function public.forum_vote_count();

alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;
alter table public.forum_votes   enable row level security;

create policy forum_threads_select on public.forum_threads for select using (
  (status = 'VISIBLE' and not public.is_user_blocked(author_id)) or author_id = (select auth.uid()) or (select public.is_staff()));
create policy forum_threads_insert on public.forum_threads for insert to authenticated with check (
  author_id = (select auth.uid()) and (select public.can_write()) and status = 'VISIBLE');
create policy forum_threads_update on public.forum_threads for update to authenticated
  using ((author_id = (select auth.uid()) and (select public.can_write())) or (select public.is_staff()))
  with check ((author_id = (select auth.uid()) and (select public.can_write())) or (select public.is_staff()));
create policy forum_threads_delete on public.forum_threads for delete to authenticated using (author_id = (select auth.uid()) or (select public.is_staff()));
revoke update on public.forum_threads from authenticated;
grant update (title, body, status) on public.forum_threads to authenticated;

create policy forum_replies_select on public.forum_replies for select using (
  (status = 'VISIBLE' and not public.is_user_blocked(author_id) and exists (select 1 from public.forum_threads t where t.id = thread_id and t.status = 'VISIBLE'))
  or author_id = (select auth.uid()) or (select public.is_staff()));
create policy forum_replies_insert on public.forum_replies for insert to authenticated with check (
  author_id = (select auth.uid()) and (select public.can_write()) and status = 'VISIBLE'
  and exists (select 1 from public.forum_threads t where t.id = thread_id and t.status = 'VISIBLE'));
create policy forum_replies_update on public.forum_replies for update to authenticated
  using ((author_id = (select auth.uid()) and (select public.can_write())) or (select public.is_staff()))
  with check ((author_id = (select auth.uid()) and (select public.can_write())) or (select public.is_staff()));
create policy forum_replies_delete on public.forum_replies for delete to authenticated using (author_id = (select auth.uid()) or (select public.is_staff()));
revoke update on public.forum_replies from authenticated;
grant update (body, status) on public.forum_replies to authenticated;

create policy forum_votes_select on public.forum_votes for select to authenticated using (user_id = (select auth.uid()));
create policy forum_votes_insert on public.forum_votes for insert to authenticated with check (
  user_id = (select auth.uid()) and (select public.can_write())
  and exists (select 1 from public.forum_threads t where t.id = thread_id and t.status = 'VISIBLE'));
create policy forum_votes_update on public.forum_votes for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy forum_votes_delete on public.forum_votes for delete to authenticated using (user_id = (select auth.uid()));
revoke update on public.forum_votes from authenticated;
grant update (value) on public.forum_votes to authenticated;

-- ---------- Votações: só o Criador abre; todos os membros votam ----------
create table public.polls (
  id         uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  question   text not null check (char_length(question) between 5 and 200),
  status     text not null default 'OPEN' check (status in ('OPEN', 'CLOSED')),
  created_at timestamptz not null default now()
);
create table public.poll_options (
  id         uuid primary key default gen_random_uuid(),
  poll_id    uuid not null references public.polls (id) on delete cascade,
  label      text not null check (char_length(label) between 1 and 80),
  position   smallint not null default 0,
  vote_count integer not null default 0,
  unique (id, poll_id)
);
create index poll_options_poll_idx on public.poll_options (poll_id, position);
create table public.poll_votes (
  poll_id    uuid not null references public.polls (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  option_id  uuid not null,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id),
  foreign key (option_id, poll_id) references public.poll_options (id, poll_id) on delete cascade
);

create or replace function public.poll_vote_count()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then update public.poll_options set vote_count = greatest(vote_count - 1, 0) where id = old.option_id; end if;
  if tg_op in ('INSERT', 'UPDATE') then update public.poll_options set vote_count = vote_count + 1 where id = new.option_id; end if;
  return null;
end $$;
create trigger poll_votes_count after insert or update or delete on public.poll_votes for each row execute function public.poll_vote_count();

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

create policy polls_select on public.polls for select using (true);
create policy polls_insert on public.polls for insert to authenticated with check (creator_id = (select auth.uid()) and (select public.is_creator()));
create policy polls_update on public.polls for update to authenticated using ((select public.is_creator())) with check ((select public.is_creator()));
create policy polls_delete on public.polls for delete to authenticated using ((select public.is_creator()));
revoke update on public.polls from authenticated;
grant update (status) on public.polls to authenticated;

create policy poll_options_select on public.poll_options for select using (true);
create policy poll_options_insert on public.poll_options for insert to authenticated with check ((select public.is_creator()));
create policy poll_options_delete on public.poll_options for delete to authenticated using ((select public.is_creator()));

create policy poll_votes_select on public.poll_votes for select to authenticated using (user_id = (select auth.uid()));
create policy poll_votes_insert on public.poll_votes for insert to authenticated with check (
  user_id = (select auth.uid()) and (select public.can_write())
  and exists (select 1 from public.polls p where p.id = poll_id and p.status = 'OPEN'));
create policy poll_votes_update on public.poll_votes for update to authenticated
  using (user_id = (select auth.uid()) and exists (select 1 from public.polls p where p.id = poll_id and p.status = 'OPEN'))
  with check (user_id = (select auth.uid()));
create policy poll_votes_delete on public.poll_votes for delete to authenticated
  using (user_id = (select auth.uid()) and exists (select 1 from public.polls p where p.id = poll_id and p.status = 'OPEN'));
revoke update on public.poll_votes from authenticated;
grant update (option_id) on public.poll_votes to authenticated;

-- ============ PARTE 2: Área de Estudo (progresso, XP e anotações) ============
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

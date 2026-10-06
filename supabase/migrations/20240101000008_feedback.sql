-- Dúvidas, ajuda e sugestões enviadas pelo botão "Ajuda" do site.
-- A gravação é feita só pelo servidor (service role, com limite de envios); só a equipe lê.
create table public.feedback (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('QUESTION', 'HELP', 'SUGGESTION')),
  message    text not null check (char_length(message) between 5 and 2000),
  contact    text check (contact is null or char_length(contact) <= 120),
  user_id    uuid references public.profiles (id) on delete set null,
  page       text check (page is null or char_length(page) <= 200),
  status     text not null default 'NEW' check (status in ('NEW', 'READ', 'DONE')),
  created_at timestamptz not null default now()
);
create index feedback_status_created_idx on public.feedback (status, created_at desc);

alter table public.feedback enable row level security;
-- sem política de INSERT: anon/authenticated não gravam direto (só o servidor, via service role)
create policy feedback_staff_select on public.feedback for select to authenticated using ((select public.is_staff()));
create policy feedback_admin_update on public.feedback for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy feedback_admin_delete on public.feedback for delete to authenticated using ((select public.is_admin()));

-- Regras do cargo CRIADOR: tem todos os poderes de ADMIN e é intocável pelos demais.
-- O CRIADOR só é atribuído por SQL (service role / SQL Editor), nunca pela API ou pelo painel.

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, auth
as $$ select coalesce(public.auth_role() in ('ADMIN', 'CREATOR'), false) and public.mfa_ok() $$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public, auth
as $$ select coalesce(public.auth_role() in ('MODERATOR', 'ADMIN', 'CREATOR'), false) and public.mfa_ok() $$;

create or replace function public.is_creator()
returns boolean language sql stable security definer set search_path = public, auth
as $$ select coalesce(public.auth_role() = 'CREATOR', false) and public.mfa_ok() $$;

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
  -- CRIADOR: ninguém vira CRIADOR nem deixa de ser pela API (só por SQL); ADMIN continua como antes
  if new.role is distinct from old.role and (new.role = 'CREATOR' or old.role = 'CREATOR') then
    new.role := old.role;
  end if;
  return new;
end $$;

grant execute on function public.is_creator() to anon, authenticated;

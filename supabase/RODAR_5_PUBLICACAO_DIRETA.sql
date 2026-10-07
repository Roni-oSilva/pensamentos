-- Publicação direta na comunidade: o que o membro publica já aparece para todos (sem aprovação prévia).
-- A equipe continua moderando depois: ocultar, remover e denúncias seguem iguais.
-- Configuração "community_autopublish" (painel → Configurações). Ligada por padrão; desligada, volta a exigir aprovação.
-- Pode ser rodado mais de uma vez.

create or replace function public.community_autopublish()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select value <> 'false'::jsonb from public.site_settings where key = 'community_autopublish'), true) $$;
revoke all on function public.community_autopublish() from public;
grant execute on function public.community_autopublish() to anon, authenticated;

-- Membro cria: rascunho, pendente, ou já publicado (quando a publicação direta está ligada).
drop policy if exists posts_insert_user on public.posts;
create policy posts_insert_user on public.posts for insert to authenticated with check (
  author_id = (select auth.uid()) and (select public.can_write()) and origin = 'COMMUNITY'
  and (status in ('DRAFT', 'PENDING') or (status = 'PUBLISHED' and (select public.community_autopublish())))
);

-- Membro edita a própria publicação (nunca as ocultadas/removidas pela equipe).
drop policy if exists posts_update_author on public.posts;
create policy posts_update_author on public.posts for update to authenticated
  using (author_id = (select auth.uid()) and (select public.can_write()) and origin = 'COMMUNITY' and status in ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED'))
  with check (author_id = (select auth.uid()) and origin = 'COMMUNITY'
    and (status in ('DRAFT', 'PENDING') or (status = 'PUBLISHED' and (select public.community_autopublish()))));

-- Guarda de colunas: com a publicação direta, editar algo publicado continua publicado.
create or replace function public.guard_post_update()
returns trigger language plpgsql security definer set search_path = public
as $$
declare staff boolean := public.is_staff();
begin
  if pg_trigger_depth() > 1 or auth.uid() is null then return new; end if;
  -- ninguém (via API de usuário) mexe em contadores, autoria ou origem
  new.author_id := old.author_id;
  new.origin := old.origin;
  new.view_count := old.view_count;
  new.like_count := old.like_count;
  new.comment_count := old.comment_count;
  new.favorite_count := old.favorite_count;
  new.share_count := old.share_count;
  if not staff then
    new.rejection_reason := old.rejection_reason;
    new.published_at := old.published_at;
    -- sem publicação direta: editar conteúdo já publicado/rejeitado volta para moderação
    if not public.community_autopublish()
       and old.status in ('PUBLISHED', 'REJECTED')
       and (new.title, new.content, new.image_url, new.kind, new.category_id)
           is distinct from (old.title, old.content, old.image_url, old.kind, old.category_id) then
      new.status := 'PENDING';
    end if;
  end if;
  if new.status = 'PUBLISHED' and old.status <> 'PUBLISHED' then
    new.published_at := coalesce(new.published_at, now());
    new.rejection_reason := null;
  end if;
  return new;
end $$;

-- Liga a publicação direta (pode ser desligada no painel).
insert into public.site_settings (key, value) values ('community_autopublish', 'true'::jsonb)
on conflict (key) do nothing;

-- O que estava esperando aprovação passa a aparecer agora.
update public.posts set status = 'PUBLISHED', published_at = coalesce(published_at, now())
 where origin = 'COMMUNITY' and status = 'PENDING';

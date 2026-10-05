-- Seed opcional: dados não sensíveis. Não cria usuários nem senhas.
insert into public.categories (name, slug, description) values
  ('Versículos',  'versiculos',  'A Palavra de Deus para meditar e guardar'),
  ('Oração',      'oracao',      'Pedidos, gratidão e intercessão'),
  ('Louvor',      'louvor',      'Engrandecer a Cristo com o coração'),
  ('Conselhos',   'conselhos',   'Palavras de sabedoria e direção'),
  ('Testemunhos', 'testemunhos', 'O que Deus tem feito'),
  ('Esperança',   'esperanca',   'Fé para os dias difíceis'),
  ('Família',     'familia',     'Lar, filhos e amor cristão')
on conflict (slug) do nothing;

insert into public.tags (name, slug) values
  ('fé', 'fe'), ('graça', 'graca'), ('amor', 'amor'), ('esperança', 'esperanca'), ('gratidão', 'gratidao')
on conflict (slug) do nothing;

insert into public.site_settings (key, value) values
  ('site_name',         '"Igreja de Cristo"'),
  ('registrations_open', 'true'),
  ('community_open',     'true')
on conflict (key) do nothing;

-- Seed opcional: dados não sensíveis. Não cria usuários nem senhas.
insert into public.categories (name, slug, description) values
  ('Dúvida',     'duvida',     'Perguntas sem resposta confortável'),
  ('Silêncio',   'silencio',   'O que sobra quando o ruído acaba'),
  ('Memória',    'memoria',    'Fragmentos do que já foi'),
  ('Absurdo',    'absurdo',    'Lógica torta, verdade inteira'),
  ('Noite',      'noite',      'Pensamentos das três da manhã'),
  ('Fé',         'fe',         'Crer, descrer, recomeçar')
on conflict (slug) do nothing;

insert into public.tags (name, slug) values
  ('insônia', 'insonia'), ('solidão', 'solidao'), ('tempo', 'tempo'), ('ironia', 'ironia')
on conflict (slug) do nothing;

insert into public.site_settings (key, value) values
  ('site_name',         '"Heresias que passam pela minha cabeça"'),
  ('registrations_open', 'true'),
  ('community_open',     'true')
on conflict (key) do nothing;

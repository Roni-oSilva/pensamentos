-- Novo cargo CRIADOR (dono do site) e novos tipos de publicação.
-- ATENÇÃO: rode ESTE arquivo sozinho e, em seguida, o 0007 em outra execução
-- (o Postgres não deixa usar um valor de enum recém-criado na mesma transação).
alter type public.user_role add value if not exists 'CREATOR';
alter type public.post_kind add value if not exists 'VERSICULO';
alter type public.post_kind add value if not exists 'CONSELHO';
alter type public.post_kind add value if not exists 'ORACAO';

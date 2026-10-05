-- Uploads de até 50 MB nos buckets community e admin (avatars continua em 2 MB).
-- Obs.: o limite global do projeto (Dashboard > Storage > Settings) precisa ser >= 50 MB (padrão do plano gratuito).
update storage.buckets set file_size_limit = 52428800 where id in ('community', 'admin');

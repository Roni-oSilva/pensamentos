-- =====================================================================
-- Storage: buckets e políticas. Pasta de nível 1 = id do usuário dono.
-- Leitura pública (URLs com UUID não adivinhável); escrita restrita.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars',   'avatars',   true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('community', 'community', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('admin',     'admin',     true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars_read"  on storage.objects for select using (bucket_id = 'avatars');
create policy "community_read" on storage.objects for select using (bucket_id = 'community');
create policy "admin_read"    on storage.objects for select using (bucket_id = 'admin');

create policy "avatars_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.can_write()));
create policy "avatars_modify" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_remove" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "community_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'community' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.can_write()));
create policy "community_remove" on storage.objects for delete to authenticated
  using (bucket_id = 'community' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_staff())));

create policy "admin_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'admin' and (select public.is_staff()));
create policy "admin_remove" on storage.objects for delete to authenticated
  using (bucket_id = 'admin' and (select public.is_admin()));

# Backup e recuperação

> Regra: **nunca** guarde credenciais (`.env`, chaves, senhas) junto dos backups. Backups contêm dados pessoais (LGPD): criptografe e restrinja o acesso. `backups/` e `*.dump` já estão no `.gitignore`.

## O que proteger
| Item | Onde vive | Como proteger |
|---|---|---|
| Banco (PostgreSQL) | Supabase | backups automáticos + `pg_dump` periódico |
| Arquivos (imagens) | Supabase Storage | cópia periódica dos buckets |
| Código | GitHub | repositório + branch `main` protegida |
| Configuração | Vercel + Supabase Auth | exportar/documentar; segredos no gerenciador de senhas |

## 1. Banco
**Automático:** planos Pro+ têm backups diários (e PITR opcional) em *Database → Backups*. No plano Free não há — faça o backup manual abaixo.

**Manual (recomendado semanalmente, via cron/GitHub Actions privado):**
```bash
# a string de conexão (Settings → Database → Connection string, modo "Session") vem de variável de ambiente, nunca do repositório
pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --schema=public -f backups/igreja-de-cristo-$(date +%F).dump
```
Criptografe antes de enviar a um armazenamento externo: `age -r <chave-publica> backups/*.dump`.

### Restaurar o banco
1. Crie um projeto Supabase novo (ou limpe o existente) e rode as migrations `0001`–`0004` (cria schema, RLS, buckets).
2. Restaure só os **dados**:
```bash
pg_restore --data-only --disable-triggers --no-owner -d "$NEW_DB_URL" backups/igreja-de-cristo-AAAA-MM-DD.dump
```
3. Usuários (`auth.users`) são do Supabase Auth: usando restauração por backup do próprio Supabase eles voltam juntos; num projeto novo, usuários precisam se cadastrar de novo (ou use o *PITR/restore* do dashboard).
4. Valide: `select count(*) from public.posts;` e teste login/admin.

## 2. Arquivos (Storage)
```bash
# com a CLI do Supabase (requer login) ou rclone/S3: Storage expõe API compatível com S3 (Project Settings → Storage → S3 Connection)
rclone sync supabase-s3:community ./backups/storage/community
rclone sync supabase-s3:avatars   ./backups/storage/avatars
rclone sync supabase-s3:admin     ./backups/storage/admin
```
**Restaurar:** recrie os buckets (migration `0004`) e `rclone sync` no sentido inverso. Mantenha a estrutura `<user_id>/<arquivo>`; as URLs gravadas no banco continuam válidas se o *Project URL* for o mesmo (caso contrário, atualize `posts.image_url`/`profiles.avatar_url` com `replace()`).

## 3. Configuração
- **Vercel:** variáveis em *Settings → Environment Variables* — mantenha uma lista dos **nomes** (veja `.env.example`) e os **valores** no gerenciador de senhas. `vercel env pull` recupera para `.env.local`.
- **Supabase Auth:** as opções (providers, URLs, SMTP, MFA, limites) não estão no banco de dados; documente-as conforme `docs/DEPLOY.md` §3.
- **Rotação:** se qualquer chave vazar, gere novas em *Settings → API* (rotate JWT secret/keys), atualize a Vercel e faça redeploy.

## 4. Recuperar o projeto do zero
1. `git clone` do GitHub.
2. Novo projeto Supabase → migrations → seed (`docs/DEPLOY.md` §1–4).
3. Restaurar dados e arquivos (seções 1 e 2).
4. Reconfigurar Auth e variáveis (§3) → importar o repositório na Vercel → domínio.
5. Promover o administrador (`update public.profiles set role='ADMIN' …`) e reativar o 2FA.
6. Rodar o checklist de produção de `docs/DEPLOY.md` §10.

## 5. Rotina de manutenção
```sql
-- diário (Supabase: Database → Cron / extensão pg_cron)
select cron.schedule('purge-rate-limits', '15 3 * * *', $$select public.purge_rate_limits()$$);
```
Teste a restauração em um projeto de homologação **a cada trimestre**: backup que nunca foi restaurado não é backup.

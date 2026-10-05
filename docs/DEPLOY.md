# Deploy: GitHub → Vercel → Supabase

## 1. Criar o projeto Supabase
1. <https://supabase.com/dashboard> → *New project*. Escolha região próxima do público (ex.: `sa-east-1`) e uma senha forte de banco (guarde no gerenciador de senhas; **não** a coloque no repositório).
2. Em *Project Settings → API* anote: `Project URL`, `anon public key`, `service_role key` (secreta).

## 2. Configurar o banco
No *SQL Editor*, execute **em ordem** cada arquivo de `supabase/migrations/`:
1. `…0001_schema.sql` — tabelas, índices, constraints
2. `…0002_functions.sql` — autorização (`is_admin`, `is_staff`…), triggers, contadores, RPCs
3. `…0003_rls.sql` — políticas RLS de todas as tabelas
4. `…0004_storage.sql` — buckets `avatars`, `community`, `admin` e políticas

Depois `supabase/seed.sql` (categorias, tags, configurações). Alternativa com CLI: `supabase link --project-ref <ref> && supabase db push`.

Verifique: *Database → Tables* — todas as tabelas devem mostrar **RLS enabled**.

## 3. Configurar Auth
*Authentication*:
- **Providers → Email**: habilitado, **Confirm email = ON**, senha mínima ≥ 10 (a aplicação também valida).
- **Multi-Factor**: habilite **TOTP**.
- **URL Configuration**: `Site URL = https://heresias.com.br` (ou a URL da Vercel) e `Redirect URLs`:
  `https://heresias.com.br/auth/callback`, `https://*.vercel.app/auth/callback` (previews), `http://localhost:3000/auth/callback`.
- **Rate Limits**: mantenha os padrões ou reduza (defesa adicional ao rate limit da aplicação).
- **Sessions** (planos que permitem): *JWT expiry* 3600 s; *Inactivity timeout* e *Time-box* para limitar sessões longas.
- **Email Templates**: (opcional) em português; o link de confirmação/recuperação deve apontar para `{{ .SiteURL }}/auth/callback?...` (o padrão PKCE já funciona).
- **SMTP próprio** (recomendado em produção) para entregabilidade e limites maiores.

## 4. Configurar Storage
Os buckets são criados pela migration `0004`. Confirme em *Storage*: `avatars` (2 MB), `community` (5 MB), `admin` (8 MB), todos JPEG/PNG/WebP. Leitura pública (URLs com UUID), escrita só na pasta do próprio usuário (`<user_id>/…`); bucket `admin` só para staff.

## 5. Variáveis de ambiente
| Variável | Onde | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (todos ambientes) | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | pública (protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel — **Sensitive**, só Production/Preview | **nunca** `NEXT_PUBLIC_`; ignora RLS |
| `NEXT_PUBLIC_SITE_URL` | Vercel | `https://heresias.com.br` |
| `REQUIRE_ADMIN_MFA` | Vercel | `true` |
| `RATE_LIMIT_SALT` | Vercel — Sensitive | `openssl rand -hex 32` (obrigatória em produção) |

## 6. GitHub
```bash
git remote add origin git@github.com:<usuario>/pensamentos.git
git push -u origin main
```
Ative em *Settings → Branches* a proteção de `main` (PR + CI verde). O workflow `.github/workflows/ci.yml` roda typecheck, lint, testes, build e os **testes de RLS**. Ative também *Secret scanning* e *Dependabot*.

## 7. Vercel
1. *Add New → Project* → importe o repositório. Framework: Next.js (detectado).
2. Cadastre as variáveis do passo 5 e faça o *Deploy*.
3. Região das Functions: escolha a mais próxima do Supabase (*Settings → Functions*).

## 8. Domínio (`heresias.com.br`)
1. Vercel → *Settings → Domains* → adicione `heresias.com.br` e `www.heresias.com.br` (redirecionar `www` → apex).
2. No Registro.br/DNS: `A  @  76.76.21.21` e `CNAME www  cname.vercel-dns.com` (ou os valores exibidos pela Vercel).
3. Atualize `NEXT_PUBLIC_SITE_URL`, o *Site URL* e as *Redirect URLs* no Supabase; redeploy. HTTPS e HSTS são automáticos.

## 9. Primeiro administrador
Cadastre-se no site, confirme o e-mail e rode no SQL Editor:
```sql
update public.profiles set role = 'ADMIN' where username = 'seu_usuario';
```
Entre em `/admin` → ative o 2FA quando solicitado → guarde os códigos de recuperação do app autenticador.

## 10. Testes de produção (checklist)
- [ ] `https://…/admin` deslogado → redireciona ao login; logado como usuário comum → 404.
- [ ] Cadastro → e-mail de confirmação chega → login funciona.
- [ ] Recuperação de senha funciona e resposta é idêntica para e-mail inexistente.
- [ ] Publicação da comunidade fica *Pendente* e só aparece após aprovação em `/admin/moderation`.
- [ ] Upload: JPG ok; `.svg`, `.html` e arquivo > limite são recusados.
- [ ] Curtir/comentar repetidamente → mensagem de limite de taxa.
- [ ] Cabeçalhos: `curl -I https://…` mostra `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`.
- [ ] Bundle: no navegador, *Sources* não contém a service role key (`grep` nos chunks).
- [ ] *Supabase → Advisors → Security* sem alertas críticos.
- [ ] Rode `select public.purge_rate_limits();` agendado (pg_cron) diariamente — ver `docs/BACKUP.md`.

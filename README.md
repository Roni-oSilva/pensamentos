# IGREJA DE CRISTO

Plataforma de conteúdo e comunidade de estética dark/minimalista: o administrador publica frases, pensamentos, reflexões e poemas; usuários cadastrados publicam na comunidade (com moderação), curtem, comentam, favoritam, seguem e compartilham.

**Stack:** Next.js 15 (App Router) · TypeScript strict · Tailwind CSS · Supabase (PostgreSQL, Auth, RLS, Storage) · TipTap · Vercel.

> Prioridades do projeto, em ordem: segurança → privacidade → integridade dos dados → UX → performance → design → escalabilidade.

## Recursos

| Área | O que existe |
|---|---|
| Público | Home, `/frases`, `/explorar` (busca + filtros), `/categoria/[slug]`, `/palavra` (palavra aleatória em tela cheia), legais (`/privacidade`, `/termos`, `/diretrizes`) |
| Comunidade | Feed com *Recentes / Em alta / Mais curtidas / Mais comentadas*, scroll infinito, publicar/editar/excluir, moderação obrigatória (`PENDING`) |
| Social | Curtir, favoritar, comentar (com respostas), seguir, compartilhar (Web Share API, copiar link, WhatsApp/X/Facebook), denunciar |
| Contas | Cadastro, login, logout, confirmação de e-mail, recuperação e troca de senha, perfil, avatar, 2FA (TOTP), exclusão da conta (LGPD) |
| Notificações | Curtidas, comentários, respostas, seguidores, aprovação/rejeição, denúncia analisada |
| Admin (`/admin`) | Dashboard, publicações oficiais com editor rico + preview, moderação, comunidade, usuários (bloquear/remover/roles), comentários, denúncias, categorias, tags, mídia, estatísticas, configurações, **logs de auditoria** |
| Segurança | RLS em todas as tabelas, roles `USER/MODERATOR/ADMIN` validadas no servidor **e** no banco, rate limiting, CSP com nonce, sanitização, validação de uploads, MFA para staff — ver [`docs/SECURITY.md`](docs/SECURITY.md) |

## Estrutura

```
src/
├── app/            rotas (App Router): públicas, /admin, /auth/callback
├── actions/        Server Actions (única superfície de escrita): auth, posts, social, profile, admin
├── components/     ui · layout · posts · community · profile · comments · auth · moderation · admin
├── lib/            supabase (server/client/admin/middleware), auth, rate-limit, sanitize, upload, validation, audit, data
└── middleware.ts   renova sessão, protege rotas, aplica CSP com nonce
supabase/
├── migrations/     schema → funções/triggers → RLS → storage (versionadas)
├── seed.sql        categorias/tags/configurações iniciais (sem usuários nem senhas)
└── tests/          testes de RLS executáveis (Postgres real)
docs/               DEPLOY.md · SECURITY.md · BACKUP.md
```

## Instalação local

Pré-requisitos: Node 20+, uma conta no [Supabase](https://supabase.com).

```bash
git clone <seu-repo> && cd pensamentos
npm ci
cp .env.example .env.local      # preencha com as chaves do seu projeto Supabase
```

1. Crie um projeto no Supabase e copie **URL**, **anon key** e **service_role key** (Project Settings → API).
2. Execute as migrations, em ordem, no *SQL Editor* (ou `supabase db push` com a CLI): `supabase/migrations/*.sql`, depois `supabase/seed.sql`.
3. Em *Authentication → URL Configuration*: `Site URL = http://localhost:3000` e `Redirect URLs += http://localhost:3000/auth/callback`.
4. `npm run dev` → <http://localhost:3000>.

### Criar o primeiro administrador

O papel `ADMIN` **nunca** é concedido pela aplicação a si mesmo. Cadastre-se normalmente em `/cadastro`, confirme o e-mail e promova a conta **uma única vez** pelo SQL Editor (executa como `postgres`, fora da API):

```sql
update public.profiles set role = 'ADMIN' where username = 'seu_usuario';
```

Depois entre em `/admin`: o painel exigirá que você ative o 2FA (`/configuracoes/seguranca`) antes de continuar.

## Scripts

| Comando | Função |
|---|---|
| `npm run dev` / `build` / `start` | desenvolvimento / build / produção |
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm test` | testes unitários de segurança (XSS, uploads, validação, redirects) |
| `npm run test:db` | migrations + **testes de RLS** em Postgres descartável |
| `npm run check` | tudo acima + build |

## Documentação

- [`docs/DEPLOY.md`](docs/DEPLOY.md) — GitHub → Vercel → Supabase, passo a passo, domínio `seudominio.com.br`
- [`docs/SECURITY.md`](docs/SECURITY.md) — modelo de ameaças, controles, matriz de testes, o que verificar em produção
- [`docs/BACKUP.md`](docs/BACKUP.md) — backup e restauração (banco, arquivos, configuração, projeto)


## Cargos
| Cargo | Poderes |
|---|---|
| Membro (`USER`) | Publica na comunidade (com moderação), curte, comenta, favorita |
| Moderador (`MODERATOR`) | Modera publicações da comunidade, comentários e denúncias |
| Administrador (`ADMIN`) | Painel completo: publicações oficiais, usuários, categorias, mídia, configurações, auditoria |
| Criador (`CREATOR`) | Dono do site: tudo o que o administrador faz, mais bloquear/remover/rebaixar administradores. Intocável pelos demais. **Só é atribuído por SQL** (nunca pelo painel ou pela API) |

Para definir o Criador (rode no SQL Editor do Supabase, trocando o e-mail):
```sql
update public.profiles set role = 'CREATOR'
where id = (select id from auth.users where email = 'SEU_EMAIL');
```
Migrations novas: rode o `0006` sozinho e depois o `0007` (o Postgres não deixa usar um valor de enum recém-criado na mesma execução).

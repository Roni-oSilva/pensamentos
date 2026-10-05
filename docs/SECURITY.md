# Segurança

Princípio: **o frontend nunca é a barreira**. Toda decisão é tomada no servidor (Server Actions / Server Components) e repetida no banco (RLS + triggers). Se uma camada falhar, a outra segura.

## Camadas de defesa

| Camada | Controle | Onde |
|---|---|---|
| Rede | HTTPS + HSTS (preload), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP | `next.config.mjs` |
| Navegador | **CSP com nonce por requisição** + `strict-dynamic`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'` | `src/middleware.ts` |
| Sessão | Supabase Auth (JWT + refresh), cookies `Secure`/`SameSite=Lax`, validação via `auth.getUser()` (não confia em cookie sem checar no Auth server) | `src/lib/supabase/*`, `src/lib/auth.ts` |
| Rotas | Middleware redireciona não logados; `/admin/*` exige role + MFA em **cada página** (layout não basta) e responde **404** a quem não é staff | `middleware.ts`, `lib/auth.ts#requireStaff` |
| Mutações | Somente Server Actions: sessão → validação zod → rate limit → RLS. Server Actions do Next verificam `Origin` (CSRF) | `src/actions/*` |
| Banco | RLS em **todas** as tabelas; triggers de guarda (role, bloqueio, contadores, autoria, status); funções `SECURITY DEFINER` com `search_path` fixo | `supabase/migrations/` |
| Storage | Políticas por pasta (`<user_id>/…`), bucket `admin` só staff, limites de tamanho e MIME no bucket | `…0004_storage.sql` |
| Auditoria | `audit_logs` imutável (sem INSERT/UPDATE/DELETE para clientes); escrita só via RPC `log_audit` (staff), `admin_id = auth.uid()` definido no banco; metadados sem segredos | `lib/audit.ts` |

## Autorização (roles)
`USER` · `MODERATOR` · `ADMIN` (enum `user_role` em `profiles.role`).

- **Ninguém concede privilégio a si mesmo:** `profiles` tem trigger `guard_profile_update` — `role` e `is_blocked` só mudam por ADMIN (e nunca o próprio). `handle_new_user` **ignora** qualquer `role` vindo de metadados de cadastro; o primeiro ADMIN é promovido manualmente via SQL (fora da API).
- Funções `is_admin()` / `is_staff()` / `can_write()` consultam o banco a cada chamada: usuário **bloqueado** perde na hora todo poder (inclusive de staff).
- **MFA no banco:** se a conta tem fator TOTP verificado, `is_admin()/is_staff()` só valem em sessão **AAL2**. Mesmo com a API, um token AAL1 roubado de um admin não ganha poderes. A aplicação ainda exige MFA para staff (`REQUIRE_ADMIN_MFA`).
- Moderadores: moderam posts da **comunidade**, comentários e denúncias; não tocam em posts oficiais, usuários, categorias, mídia, configurações nem logs.
- `service_role` é usada **só em servidor** (`lib/supabase/admin.ts` importa `server-only`) e apenas para: rate limit, contadores públicos (`register_view/share`), tags novas, bloquear/remover usuário e e-mail na lista de usuários — sempre **após** autorizar o chamador.

## Moderação
Posts da comunidade só podem ser inseridos como `DRAFT`/`PENDING` (RLS). O autor **não** consegue se auto-aprovar; editar um post `PUBLISHED`/`REJECTED` o devolve a `PENDING` (trigger). Posts de usuários bloqueados somem do público.

## XSS e conteúdo
- Comunidade e comentários: **texto puro**, renderizado pelo React (escape automático), `white-space: pre-wrap`.
- Posts oficiais (HTML do TipTap): `sanitize-html` com lista branca estrita **na gravação e novamente na renderização**: sem `script/iframe/svg/style/on*`, links só `http(s)/mailto` com `rel="noopener noreferrer nofollow ugc"`, imagens só `https` do Storage do projeto.
- Preview do editor roda em `<iframe sandbox="">` (sem scripts).
- URLs de imagem enviadas pelo cliente são validadas (host do projeto + bucket + pasta do usuário).

## Uploads
Limite por bucket (avatars 2 MB; community e admin 50 MB), tipos JPEG/PNG/WebP (SVG proibido), extensão **e** MIME **e** assinatura binária (magic bytes) conferidos no servidor, nome gerado pelo servidor (`<uid>/<uuid>.<ext>`, nome original descartado), upload feito com o **cliente do usuário** (as políticas de Storage valem). Imagens grandes vão **direto do navegador ao Storage** por URL assinada de uso único (a Vercel limita o corpo a ~4,5 MB); o servidor emite a URL (`requestUpload`) e confere o arquivo depois (`finishUpload`: assinatura binária + tamanho, apagando se inválido), rate limit de 12 uploads/10 min.

## Rate limiting
Tabela `rate_limits` (janela fixa) acessada só por `service_role` via RPC `rate_limit_hit` — funciona em serverless. Falha **fechada** (se o limitador falhar, bloqueia). IP é guardado como hash com sal (`RATE_LIMIT_SALT`).

| Ação | Limite |
|---|---|
| login | 8 / 5 min (por IP **e** por e-mail) |
| cadastro / recuperação de senha | 4 / hora (por IP; recuperação também por e-mail) |
| troca de senha / exclusão de conta | 6 / 15 min |
| publicação | 6 / hora |
| comentário | 20 / 10 min |
| curtida / favorito | 80 / min |
| seguir | 30 / min |
| denúncia | 10 / hora |
| upload | 12 / 10 min |
| compartilhamento | 30 / min (IP) |
| visualização | 1 por IP+post / hora |
| ações admin | 300 / min |

Complementos: limites nativos do Supabase Auth (e-mails, OTP) e Vercel Firewall/WAF para volume bruto.

## Privacidade (LGPD)
- E-mail vive só em `auth.users`; `profiles` não tem e-mail, IP ou dados privados. Páginas públicas selecionam colunas explícitas.
- Curtidas e favoritos são privados (RLS `user_id = auth.uid()`); o público vê apenas contadores.
- Usuário edita seus dados, exclui publicações e **exclui a conta** (reautentica com senha; cascade apaga perfil, posts, comentários, curtidas, favoritos, notificações).
- Páginas de Privacidade, Termos e Diretrizes; sem cookies de rastreamento, sem fontes externas (fontes do sistema).
- Mensagens de erro genéricas ao usuário; detalhes nunca são devolvidos. Cadastro e recuperação respondem igual para e-mail existente/inexistente (anti-enumeração).

## Matriz de testes (item 34 do escopo)

Legenda: ✅ automatizado e passando · 🔎 verificado por inspeção de código/execução local · 🧪 **exige ambiente real** (Supabase + Vercel) — rode o checklist de `docs/DEPLOY.md` §10 antes de abrir ao público.

| Teste | Resultado | Como |
|---|---|---|
| Usuário comum acessando `/admin` | ✅/🔎 | Anônimo: 307 → `/login` (verificado com `next start`). Logado sem role: `requireStaff` → `notFound()`. 🧪 confirmar com conta real |
| Usuário comum alterando role (própria/outra) | ✅ | `rls.test.sql`: update de outro = 0 linhas; da própria = role inalterada (trigger) |
| Editar / excluir publicação de outro | ✅ | `rls.test.sql`: 0 linhas afetadas |
| Acesso direto a IDs de outros (IDOR) | ✅ | posts pendentes invisíveis, favoritos/curtidas/notificações/reports privados, `rate_limits` e `audit_logs` fechados |
| Auto-aprovação / criar post oficial / postar como outro | ✅ | `rls.test.sql` (insert negado) |
| Contadores forjados (likes/views) | ✅ | zerados no insert, imutáveis no update |
| Privilege escalation via metadados de cadastro | ✅ | `rls.test.sql`: `{"role":"ADMIN"}` → perfil `USER` |
| Moderador fora do escopo | ✅ | não altera post oficial, não se promove, não lê audit_logs |
| Admin com MFA em sessão AAL1 | ✅ | `is_admin()` = false; audit_logs inacessível |
| Usuário bloqueado | ✅ | não comenta/publica; perde staff; perfil oculto |
| `audit_logs` imutável / sem insert direto | ✅ | UPDATE/DELETE/INSERT negados |
| RPCs sensíveis (`rate_limit_hit`, `register_view`, `admin_stats`) | ✅ | negadas a anon/usuário comum |
| Storage: escrever no bucket `admin` / pasta alheia | ✅ | `rls.test.sql` (políticas) · 🧪 repetir via API real |
| Upload inválido (HTML/SVG/EXE renomeado) | ✅ | `tests/security.test.ts` (assinatura binária) |
| Upload excessivo | 🔎 | checagem de tamanho no servidor + limite do bucket + `bodySizeLimit` 6 MB · 🧪 testar com arquivo grande |
| XSS em publicações oficiais | ✅ | 9 payloads (`script`, `onerror`, `javascript:`, `iframe`, `svg`, `data:`, `style`, imagem externa) removidos |
| XSS em comentários / comunidade | 🔎 | texto puro renderizado pelo React; sem `dangerouslySetInnerHTML` fora de `PostBody` oficial (sanitizado) |
| Open redirect (`?next=`) | ✅ | `safeRedirect` testado |
| Injeção em busca (LIKE/filtros PostgREST) | ✅ | `escapeLike` testado |
| Spam de comentários / curtidas / tentativas de login | ✅/🧪 | função `rate_limit_hit` testada (3ª chamada negada); 🧪 confirmar mensagens na UI em produção |
| Exposição de variáveis / service role no bundle | ✅ | `grep` do `.next/static` no CI (falha se encontrar); `server-only` no cliente admin |
| Cabeçalhos de segurança + CSP com nonce | ✅ | verificado com `curl -I` em `next start` |
| Fluxo MFA / confirmação de e-mail / recuperação | 🧪 | dependem do Supabase Auth real |

Executar: `npm test` (unitários), `npm run test:db` (migrations + RLS), `npm run check` (tudo + build). O CI roda os três em todo PR.

## Limitações conhecidas e decisões
- **Leitura pública no Storage:** imagens são acessíveis por URL com UUID (não adivinhável), inclusive de posts ainda não aprovados. Para conteúdo sensível usar URLs assinadas.
- **Cookies de sessão não são `HttpOnly`:** necessário porque o fluxo TOTP usa o cliente do navegador. Mitigado por CSP com nonce e sanitização; se não precisar de MFA no navegador, migre o fluxo para Server Actions e use `httpOnly`.
- **`style-src 'unsafe-inline'`:** estilos inline não executam código; scripts permanecem estritos (nonce).
- **Tags criadas por usuários** usam `service_role` após validação; o abuso é limitado pelo rate limit de publicações (6/h × 5 tags). Admin pode limpar em `/admin/tags`.
- **Remoção de usuário/conta** apaga os dados do banco; arquivos órfãos no Storage podem ser removidos em `/admin/media` ou por rotina de limpeza.
- **Rate limit** é por janela fixa (picos na virada da janela) e por IP (`x-forwarded-for` da Vercel). Para proteção volumétrica use o Firewall da Vercel/Cloudflare.
- **Busca** usa `ILIKE` com índices trigram; para grande escala migre para `tsvector`/busca dedicada.
- **Em alta** é calculado por RPC a cada requisição; para alto tráfego, materialize/cache.

## Resposta a incidentes (resumo)
1. Revogar sessões (Supabase → Authentication → Users → *Sign out*), rotacionar chaves (Settings → API) e `RATE_LIMIT_SALT`, redeploy.
2. Bloquear contas envolvidas em `/admin/users`; consultar `/admin/audit-logs`.
3. Restaurar conforme `docs/BACKUP.md` se houver adulteração de dados.
4. Avisar usuários e a ANPD quando houver risco relevante (LGPD art. 48).

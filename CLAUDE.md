# CLAUDE.md — RealConect

## ⚠️ ANTES DE TUDO

**LEIA `docs/STATE.md` AGORA, antes de qualquer ação.** Ele descreve exatamente
onde paramos e qual é o próximo passo concreto. Sem ler, você duplica trabalho ou
desfaz decisões. É a regra mais importante deste projeto.

Depois, conforme a tarefa, consulte os docs já existentes em `docs/`:
- `docs/ARCHITECTURE.md` — visão geral, stack, estrutura, fluxo, schema do banco
- `docs/DEVELOPMENT-LOG.md` — histórico de sessões (funcionalidades + correções)
- `docs/PROMPTS.md` — todos os prompts do Eros (saudação, dica, chat, análise)
- `docs/CREDENTIALS.md` — quais credenciais existem e onde (valores em `.env.local`)
- `docs/DECISIONS.md` — ADRs (decisões arquiteturais)

## Sobre este projeto

**RealConect** (https://realconect.com) é um experimento narrativo de conexão
humana entre dois participantes (Felipe Calixto e Samira Vieira). Eles percorrem
**6 etapas** respondendo perguntas, interagem com um oráculo de IA chamado
**Eros**, e desbloqueiam progressivamente uma "lenda" na homepage. A cada etapa há
análise de compatibilidade gerada por IA, "3+1 desejos" (chat com o Eros), dicas
contextuais, timeline de eventos e gauges visuais de conexão.

É um app PWA pessoal/íntimo — não é SaaS multi-tenant. O par de usuários é fixo.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19.2.3 + Tailwind CSS 4 |
| Linguagem | TypeScript 5 |
| Banco + Auth | Supabase (PostgreSQL gerenciado) + `@supabase/ssr` |
| IA / LLM | OpenAI `gpt-4o-mini` (oráculo Eros) |
| TTS | ElevenLabs (`eleven_multilingual_v2`, voz `x6uRgOliu4lpcrqMH3s1`) |
| Hospedagem | Vercel (auto-deploy via push em `main`) |
| Repo | github.com/felipecalixtoreis/realconect.git |

## Acesso e ambiente

- **Cópia de trabalho:** VPS `soia-vps` em `/var/www/realconect` (este cwd no Cockpit).
- **Produção:** Vercel em `realconect.com`. ⚠️ **Editar na VPS NÃO publica** — o
  deploy só acontece via `git push` no branch `main` (GitHub → Vercel). Sempre
  commitar + push pra mudança ir pro ar.
- **Banco direto:** ver `docs/CREDENTIALS.md` (psql na porta `6543`, transaction mode).
- **Credenciais reais:** em `.env.local` (não versionado). Nunca commitar nem
  expor valores; `docs/CREDENTIALS.md` documenta apenas *quais* existem e onde.

## Arquitetura — pontos-chave

- **3 clientes Supabase** (`src/lib/supabase/`): `client.ts` (browser anon),
  `server.ts` (server components/API com cookies), `admin.ts` (service role,
  bypassa RLS — só pra operações administrativas).
- **Middleware** (`src/middleware.ts`) separa rotas públicas (`/`, `/login`,
  `/auth/*`, `/set-password`, `/api/etapas`, `/api/progresso-publico`, estáticos)
  de protegidas (`/dashboard/*`, `/admin`, demais `/api/*`).
- **Eros** vive em `src/lib/openai.ts` (saudação, dica, chat) + `src/lib/historico.ts`
  (histórico acumulado). Personalização vem de 4 fontes: admin_context, respostas
  das etapas, perguntas dos desejos, histórico do outro participante.
- **Etapas dinâmicas:** carregadas da tabela `etapas_config` com fallback hardcoded
  em `src/lib/etapas.ts`.
- Schema completo do banco em `docs/ARCHITECTURE.md` (tabelas: profiles,
  experiment_session, respostas, indices, timeline, genie_interactions,
  bonus_wishes, eros_hints, admin_context, etapas_config).

## Gotchas (já custaram tempo — não reincidir)

- **`/api/analyze` lê respostas direto do banco com admin client**, independente do
  toggle `autorizar_exibicao`. Frontend passar `resposta_user1` dava `null` quando
  o outro não autorizou → análise não gerava. Não voltar a depender do toggle.
- **Tabela `respostas` não tem RLS policy de UPDATE** — qualquer update (ex.
  autorizar exibição) DEVE usar `createAdminClient()`, senão falha silenciosamente.
- **Middleware precisa excluir `.json`/`manifest.json`** do matcher, senão
  intercepta `/manifest.json` e quebra o PWA.
- **TTS no iOS** exige o hack do `public/silence.wav` (destrava AudioContext antes
  do auto-play). `src/lib/audioManager.ts` centraliza isso — usar ele, não
  `HTMLAudioElement` cru.
- **Saudação do Eros usa cache em `sessionStorage`** (chave
  `eros_greeted_{sessionId}_{etapaAtual}_{totalRespondidas}`). Coluna correta no
  banco é `resposta` (não `resposta_texto`).
- **Bonus de desejos:** `bonus_wishes` tem `UNIQUE(session_id, user_id)` — 1 bônus
  por experimento. Detecção por regex em `isAskingForMoreWishes()`.
- **Supabase free pausa por inatividade (~1 semana)** → o host
  `ljuhtcgldzuuagfeglvi.supabase.co` some do DNS (NXDOMAIN). Como o login é
  client-side (browser fala direto com o Supabase), **o app inteiro "quebra" no
  login pra todos** — parece senha errada, mas é o backend pausado. Sintoma:
  `npm`/curl no host dá NXDOMAIN. Correção: reativar o projeto no painel
  (`app.supabase.com/project/ljuhtcgldzuuagfeglvi`); os dados ficam intactos. Após
  reativar, o gateway retorna HTML "resuming" por alguns minutos até o auth subir.
  Reset de senha: `admin.auth.resetPasswordForEmail(email, { redirectTo:
  'https://realconect.com/auth/callback?next=/set-password' })` com service role.
  A VPS não tem DNS pro host do Supabase — rodar scripts que falam com ele exige
  rede liberada (a VPS é só cópia de trabalho; produção roda na Vercel).

## Protocolo de continuidade entre sessões (regra durável)

**Início de sessão:** leia este arquivo (automático) → **leia `docs/STATE.md`
inteiro** (primeira ferramenta) → confirme ambiguidades com o usuário.

**Antes de declarar qualquer coisa "pronta":**
1. **Validar tecnicamente** — `npm run build`, lint, ou curl no endpoint. Não pedir
   validação visual sem ter provado que funciona.
2. **Atualizar `docs/STATE.md`** — data, o que foi feito, o que funciona/não
   funciona, **próximo passo concreto** (arquivos + ação + validação esperada).
3. Se houve **decisão arquitetural**, adicionar ADR em `docs/DECISIONS.md`.
4. Se a mudança precisa ir pro ar: `git commit` + `git push origin main` (Vercel
   faz o deploy). Avise o usuário que o deploy foi disparado.

**Princípios:** step-by-step (uma mudança lógica por vez); sem gambiarras (usar
mecanismos nativos da stack); documentação é parte do "done"; quando há acesso
(SSH, banco, repo), busque a informação você mesmo em vez de perguntar.

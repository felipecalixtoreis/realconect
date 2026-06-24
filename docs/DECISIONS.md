# DECISIONS.md — Log de decisões arquiteturais (RealConect)

> Append-only. Cada decisão não trivial vira um ADR leve.
> Formato: ADR NNN — Título · Data · Status · Contexto · Decisão · Consequência.
> Os ADRs 002–009 foram reconstruídos no onboarding (2026-06-24) a partir de
> `docs/ARCHITECTURE.md` e `docs/DEVELOPMENT-LOG.md` — datas aproximadas (Mar/2026).

---

## ADR 001 — Adoção do protocolo de continuidade entre sessões

**Data**: 2026-06-24 · **Status**: aceita

**Contexto**: sessões com IA perdem o fio se cada conversa começa sem saber o que
foi feito antes. O projeto já tinha docs ricos (ARCHITECTURE/CREDENTIALS/PROMPTS/
DEVELOPMENT-LOG) mas faltava um "estado vivo" + instruções durávies.

**Decisão**: usar `CLAUDE.md` (instruções durávies, na raiz) + `docs/STATE.md`
(estado vivo) + `docs/DECISIONS.md` (este log), lidos/atualizados a cada sessão.

**Consequência**: STATE.md precisa ser atualizado ao final de cada implementação —
virou parte do "definition of done".

---

## ADR 002 — Next.js 16 (App Router) + Vercel

**Data**: Mar/2026 · **Status**: aceita

**Contexto**: app web pessoal com SSR, rotas de API e necessidade de deploy simples.

**Decisão**: Next.js 16 com App Router (TypeScript, Tailwind 4), hospedado na Vercel
com auto-deploy via push no branch `main`.

**Consequência**: deploy é trivial mas **acoplado ao git** — editar a cópia da VPS
(`/var/www/realconect`) não publica nada; só `git push origin main` vai pro ar.

---

## ADR 003 — Supabase (Auth + Postgres) com três clientes distintos

**Data**: Mar/2026 · **Status**: aceita

**Contexto**: precisa de auth, banco relacional e operações server-side seguras.

**Decisão**: Supabase para Auth (email/senha via `@supabase/ssr`) e Postgres. Três
clientes: browser (anon), server (anon com cookies) e admin (service role). RLS
protege os dados; operações administrativas usam o admin client pra bypassar RLS.

**Consequência**: o service role key é secreto e perigoso — restrito a `admin.ts`
e endpoints administrativos. Nunca usar no client.

---

## ADR 004 — `/api/analyze` lê respostas direto do banco (independe da autorização)

**Data**: Mar/2026 (Sessão 3) · **Status**: aceita

**Contexto**: a análise de compatibilidade não gerava na etapa 2 — o frontend
mandava `resposta_user1`, que vinha `null` quando o outro participante não
autorizava exibir a resposta.

**Decisão**: o `/api/analyze` busca as respostas de ambos direto do banco com admin
client, **independente** do toggle `autorizar_exibicao`. A autorização controla
apenas a *exibição* entre participantes, não a análise. Adicionado auto-recovery:
ao revisitar uma etapa com análise faltando, ela é re-disparada.

**Consequência**: a análise sempre roda quando os dois responderam. O toggle de
autorização é puramente de UI/privacidade entre os dois.

---

## ADR 005 — Update em `respostas` exige admin client (falta RLS de UPDATE)

**Data**: Mar/2026 (Sessão 3) · **Status**: aceita

**Contexto**: o toggle de autorização não persistia. A tabela `respostas` tem RLS
para INSERT e SELECT, mas **não** para UPDATE.

**Decisão**: endpoints que fazem UPDATE em `respostas` (ex. `/api/resposta/autorizar`)
usam `createAdminClient()`. Não criar policy de UPDATE pra usuário comum.

**Consequência**: qualquer novo update nessa tabela precisa passar pelo admin client.

---

## ADR 006 — Etapas dinâmicas no banco com fallback hardcoded

**Data**: Mar/2026 · **Status**: aceita

**Contexto**: o conteúdo das 6 etapas (narrativa, pergunta, opções) muda durante o
experimento e precisa ser editável sem deploy.

**Decisão**: etapas vivem na tabela `etapas_config`, editáveis pelo painel admin,
com um array hardcoded em `src/lib/etapas.ts` como fallback.

**Consequência**: ajustar conteúdo de etapa é via admin/banco, não via código.

---

## ADR 007 — TTS via ElevenLabs com hack de iOS

**Data**: Mar/2026 · **Status**: aceita

**Contexto**: o Eros fala (auto-play). Safari/iOS bloqueia AudioContext sem gesto
do usuário, quebrando o auto-play.

**Decisão**: TTS pela API ElevenLabs (`eleven_multilingual_v2`). Pra iOS, tocar
`public/silence.wav` num gesto do usuário (ex. clique no botão da etapa) destrava o
AudioContext antes do auto-play. Centralizado em `src/lib/audioManager.ts`.

**Consequência**: novo áudio deve passar pelo `audioManager`, não por
`HTMLAudioElement` cru, ou o iOS volta a falhar.

---

## ADR 008 — Bônus de desejos: detecção por regex + 1 por experimento

**Data**: Mar/2026 (Sessão 3) · **Status**: aceita

**Contexto**: além dos 3 desejos por etapa, dar +1 quando o participante pede mais —
mas sem virar loop infinito de desejos.

**Decisão**: detectar pedidos com ~12 padrões regex (`isAskingForMoreWishes()`);
conceder o bônus com mensagem hardcoded; registrar em `bonus_wishes` com
`UNIQUE(session_id, user_id)` — no máximo 1 bônus por experimento.

**Consequência**: a detecção é heurística (PT-BR) e pode precisar de novos padrões;
o teto de 1 bônus é garantido no schema.

---

## ADR 009 — Eros como gpt-4o-mini com 4 fontes de personalização

**Data**: Mar/2026 (Sessão 2) · **Status**: aceita

**Contexto**: o oráculo precisa soar pessoal e consistente, sem custo alto.

**Decisão**: usar OpenAI `gpt-4o-mini`. As respostas do Eros (saudação, dica, chat)
são enriquecidas com 4 fontes: `admin_context` (perfis manuais), respostas das
etapas, perguntas dos desejos e histórico do outro participante
(`buscarHistoricoAcumulado()`). Prompts versionados em `docs/PROMPTS.md`, com regra
de variar aberturas (nunca começar com "Ah,").

**Consequência**: mudanças de tom do Eros se fazem nos prompts (`docs/PROMPTS.md` +
`src/lib/openai.ts`), não trocando de modelo. Endpoint sandbox
`/api/admin/test-genie` permite testar sem salvar no banco.

---

(adicione novos ADRs abaixo conforme as decisões forem tomadas)

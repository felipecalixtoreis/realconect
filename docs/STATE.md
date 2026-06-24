# STATE.md — Estado vivo do projeto RealConect

> **Antes de fazer qualquer coisa, LEIA ESTE ARQUIVO INTEIRO.**
> Atualizado a cada implementação concluída. Ver `CLAUDE.md` pro protocolo completo.
>
> Última atualização: 2026-06-24 (recuperação de acesso + nova fase: Felipe ↔ Maria Clara)

## Incidente resolvido nesta sessão (2026-06-24)

Felipe não conseguia logar (achava que era senha esquecida). Diagnóstico real:
**o projeto Supabase `ljuhtcgldzuuagfeglvi` estava PAUSADO por inatividade** →
o host sumiu do DNS (NXDOMAIN no Cloudflare e Google). Como o login é client-side
(browser fala direto com o Supabase, URL embutida no build de produção apontava
pro host morto), o app quebrava no login **pra todos** — não era senha.

- Felipe reativou o projeto no painel do Supabase (dados ficam intactos ao pausar).
- Após reativar, o gateway retorna HTML "resuming" por alguns minutos até o auth subir.
- `resetPasswordForEmail` retornou OK mas **o e-mail NÃO foi entregue** — o serviço
  de e-mail embutido do Supabase free é não-confiável (rate-limit, sem SMTP). Felipe
  também não conseguia logar com a senha antiga.
- Diagnóstico via `admin.auth.admin.listUsers`: 2 contas existem e estão saudáveis —
  `felipekalixto@gmail.com` (id `4287ea93-...`) e `samira_vigui@outlook.com`, ambas
  com e-mail confirmado, último login 2026-03-20. A conta nunca foi o problema.
- **Resolução**: senha definida direto via `admin.auth.admin.updateUserById` (sem
  depender de e-mail) e validada com `signInWithPassword` (login OK ponta a ponta).
  Felipe recebeu a senha temporária no chat para entrar.
- Gotcha documentado em `CLAUDE.md`. NB: a página `/login` **não tem** botão
  "esqueci a senha" nem tela de trocar senha logado — melhoria futura sugerida
  (rota pública de reset + botão; ou trocar de provedor de e-mail/SMTP).

## Nova fase do experimento (2026-06-24)

Felipe iniciou um experimento novo com **Maria Clara** (no lugar da Samira):

- **Conta criada**: `lemosmariaclara@yahoo.com` / nome de registro "Maria Clara"
  (nas narrativas aparece "Maria" — `etapas.ts` usa `nome.split(' ')[0]`).
  user_id `4452ecd8-7914-45ab-8a5e-3d7fbb9227a7`.
- **Experimento antigo apagado permanentemente**: a sessão Felipe ↔ Samira foi
  deletada (cascata: respostas/índices/timeline/desejos/dicas/contexto/bônus).
  As respostas do Felipe também zeraram (a pedido dele).
- **Sessão nova ativa**: Felipe ↔ Maria Clara, etapa 1, 0 respostas
  (id `074ed531-794d-4ec3-9c80-5814cb7ee702`).
- **Conta da Samira preservada** (login + profile), apenas sem sessão. Felipe pode
  pedir pra apagá-la depois.
- Logins validados via `signInWithPassword` (Felipe e Maria Clara).

### Feature nova no painel admin: "📊 Acompanhamento por Etapa"
- `src/app/admin/page.tsx`: seção que mostra, por etapa (1→6), os dois participantes
  lado a lado — ✓ respondeu / ⏳ pendente, texto da resposta, opções, pedidos ao Eros
  (desejos) expandíveis, compatibilidade % da etapa, e barra de progresso por pessoa.
- `src/app/api/admin/progresso/route.ts` (novo): GET `?session_id=` → `{ respostas,
  desejos, indices }` (admin client, auth-gated). Build validado (`npm run build`).

## Onde estamos agora

App **em produção** em https://realconect.com (Vercel, deploy via push em `main`).
O experimento entre Felipe e Samira está rodando: as 6 etapas, o oráculo Eros
(saudação, dica, chat de desejos), análise de compatibilidade, resultado final,
homepage com lenda progressiva, PWA e painel admin estão todos implementados e no ar.

A frente de trabalho mais recente (ver git log) foi o **sistema de encerramento do
experimento** (`ExperimentClosure`): mensagem de despedida do Eros, exibição de
fragmentos desbloqueados + "perdido para sempre", botão de reativação no admin, e
correções de TTS/iOS na tela de encerramento.

Esta sessão foi **onboarding no Cockpit**: leitura da documentação existente e
criação dos arquivos do protocolo de continuidade (CLAUDE.md, STATE.md, DECISIONS.md)
+ configuração de plugins. Nenhuma mudança funcional no app foi feita.

## Última iteração concluída (pelo histórico do repo)

- **Tema**: Sistema de encerramento do experimento + ajustes de TTS/iOS
- **Commits recentes** (`main`):
  - `cc67ca5` Track closure visits and show status on Felipe's dashboard
  - `162ece9` Unlock audio on etapa button click for seamless iOS auto-play
  - `29a266f` Add prominent callout arrow pointing to Eros hint button
  - `20d6284` Fix hint replay: always play actual hint text, enhance visibility
  - `7c5073b` Add experiment closure system with Eros farewell message
- **Arquivos**: `src/components/ExperimentClosure.tsx`, `src/middleware.ts`,
  `src/lib/audioManager.ts`, páginas de etapa/dashboard.

## O que está funcionando

- [x] Auth por email/senha (Supabase + SSR) + middleware de proteção de rotas
- [x] 6 etapas dinâmicas (banco `etapas_config` + fallback hardcoded)
- [x] Submissão de respostas (texto e múltipla escolha) + toggle de autorização
- [x] Análise de compatibilidade via OpenAI (lê banco direto, com auto-recovery)
- [x] Resultado final poético após 6 etapas
- [x] Eros: saudação personalizada, dica flutuante, chat dos 3+1 desejos
- [x] Sistema de bônus de desejos (regex + `bonus_wishes`, 1 por experimento)
- [x] TTS ElevenLabs com hack de iOS (`silence.wav` / `audioManager`)
- [x] Homepage com lenda progressiva, PWA (manifest + ícones + install prompt)
- [x] Painel admin (CRUD sessões/usuários/respostas/etapas/contexto + sandbox Eros)
- [x] Sistema de encerramento do experimento (`ExperimentClosure`)
- [x] Deploy automático na Vercel via push em `main`

## O que ainda NÃO funciona / em aberto

- [ ] (a confirmar com o usuário qual é a próxima feature desejada)
- [ ] Nenhum bloqueio técnico conhecido registrado nos docs

## Próximo passo concreto

**Objetivo**: definir com Felipe a próxima frente de trabalho — o app está
completo e no ar, então a próxima sessão depende da intenção dele (nova feature,
ajuste de conteúdo das etapas, refino do Eros, ou manutenção).

**Ações sugeridas ao iniciar a próxima sessão de código**:
1. `git -C /var/www/realconect log --oneline -10` pra ver se houve trabalho desde aqui
2. `npm run build` pra confirmar que o projeto compila limpo antes de mexer
3. Perguntar/confirmar o objetivo da iteração
4. Implementar step-by-step; ao terminar, `git push origin main` (dispara Vercel)
   e atualizar este STATE.md

**Validação esperada**: build limpo + endpoint/feature testado antes de declarar pronto.

## Bloqueios conhecidos

(nenhum identificado)

## Estado relevante do filesystem

```
/var/www/realconect/
├── src/
│   ├── app/            # App Router: page (lenda), login, set-password, auth,
│   │   │               # dashboard/{etapa/[id],resultado}, admin, api/*
│   │   └── api/        # session, resposta(+autorizar), analyze(+final),
│   │                   # eros-greeting, eros-hint, genie, tts, etapas,
│   │                   # progresso-publico, auth/signout, admin/*
│   ├── components/     # ErosAvatar, GenieChat, EtapaCard, CountdownTimer,
│   │                   # OracleOfEros, FinalResult, CompatibilityChart,
│   │                   # HeartGauge, Timeline, ExperimentClosure, InstallPWA...
│   ├── lib/            # openai.ts, historico.ts, etapas.ts, audioManager.ts,
│   │                   # supabase/{client,server,admin,types}.ts
│   └── middleware.ts
├── supabase/           # schema.sql, migration_bonus_wishes.sql, config.toml
├── docs/               # ARCHITECTURE, CREDENTIALS, PROMPTS, DEVELOPMENT-LOG,
│                       # STATE (este), DECISIONS
├── public/             # manifest.json, icons/, silence.wav
└── .env.local          # credenciais (não versionado)
```

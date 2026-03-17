# realconect.com — Arquitetura Completa

## Visao Geral

RealConect e um experimento narrativo de conexao humana onde dois participantes (Felipe Calixto e Samira Vieira) percorrem 6 etapas respondendo perguntas, interagindo com um oraculo de IA chamado **Eros**, e desbloqueando progressivamente uma lenda na pagina inicial.

- **URL de producao:** https://realconect.com
- **Repositorio:** https://github.com/felipecalixtoreis/realconect.git
- **Deploy:** Vercel (auto-deploy via push no branch `main`)
- **Data de inicio:** Marco 2026

---

## Stack Tecnologico

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Linguagem | TypeScript | 5.x |
| Estilizacao | Tailwind CSS | 4.x |
| Banco de Dados | Supabase (PostgreSQL) | Gerenciado |
| Autenticacao | Supabase Auth + SSR | @supabase/ssr |
| IA / LLM | OpenAI GPT-4o-mini | API |
| Text-to-Speech | ElevenLabs | API v1 |
| Hospedagem | Vercel | Auto |

---

## Estrutura de Diretorios

```
/var/www/realconect/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── page.tsx                   # Homepage (lenda progressiva)
│   │   ├── layout.tsx                 # Layout raiz (meta tags, fonts)
│   │   ├── globals.css                # CSS global + animacoes Eros
│   │   ├── login/page.tsx             # Tela de login
│   │   ├── set-password/page.tsx      # Criacao de senha (Samira)
│   │   ├── auth/callback/page.tsx     # Callback OAuth/reset senha
│   │   ├── admin/page.tsx             # Painel administrativo
│   │   ├── dashboard/
│   │   │   ├── page.tsx               # Dashboard principal
│   │   │   ├── layout.tsx             # Layout do dashboard
│   │   │   ├── etapa/[id]/page.tsx    # Pagina de cada etapa
│   │   │   └── resultado/page.tsx     # Resultado final
│   │   └── api/                       # API Routes
│   │       ├── session/route.ts       # Sessao do usuario
│   │       ├── resposta/route.ts      # Submissao de respostas
│   │       ├── resposta/autorizar/route.ts  # Toggle autorizacao
│   │       ├── analyze/route.ts       # Analise de compatibilidade
│   │       ├── analyze/final/route.ts # Resumo final
│   │       ├── eros-greeting/route.ts # Saudacao do Eros
│   │       ├── eros-hint/route.ts     # Dica do Eros
│   │       ├── genie/route.ts         # 3+1 desejos (chat com Eros + bonus)
│   │       ├── tts/route.ts           # Text-to-Speech ElevenLabs
│   │       ├── etapas/route.ts        # Config etapas (publico)
│   │       ├── progresso-publico/route.ts  # Progresso (publico)
│   │       ├── auth/signout/route.ts  # Logout
│   │       └── admin/                 # Endpoints admin
│   │           ├── data/route.ts      # GET dados gerais
│   │           ├── session/route.ts   # CRUD sessoes
│   │           ├── users/route.ts     # CRUD usuarios
│   │           ├── respostas/route.ts # CRUD respostas
│   │           ├── context/route.ts   # CRUD contexto IA
│   │           ├── etapas/route.ts    # CRUD etapas
│   │           ├── send-reset/route.ts # Enviar reset senha
│   │           └── test-genie/route.ts # Sandbox Eros (nao salva dados)
│   ├── components/
│   │   ├── ErosAvatar.tsx             # Avatar + saudacao + TTS
│   │   ├── ErosFloatingHint.tsx       # Botao flutuante de dica
│   │   ├── EtapaCard.tsx              # Card de pergunta/resposta
│   │   ├── GenieChat.tsx              # Chat dos 3+1 desejos (com bonus)
│   │   ├── CountdownTimer.tsx        # Countdown para proxima etapa (20h)
│   │   ├── OracleOfEros.tsx           # Visualizacao animada
│   │   ├── FinalResult.tsx            # Resultado final
│   │   ├── CompatibilityChart.tsx     # Grafico compatibilidade
│   │   ├── HeartGauge.tsx             # Gauge de coracao
│   │   ├── Timeline.tsx               # Linha do tempo
│   │   ├── LoadingScreen.tsx          # Tela de loading
│   │   └── InstallPWA.tsx             # Prompt instalacao PWA
│   ├── lib/
│   │   ├── openai.ts                  # Funcoes OpenAI (Eros)
│   │   ├── historico.ts               # Busca historico acumulado
│   │   ├── etapas.ts                  # Definicoes das 6 etapas
│   │   ├── audioManager.ts            # Gerenciador audio (iOS)
│   │   └── supabase/
│   │       ├── client.ts              # Cliente browser
│   │       ├── server.ts              # Cliente server components
│   │       └── admin.ts               # Cliente service role
│   └── middleware.ts                  # Protecao de rotas
├── public/
│   ├── manifest.json                  # PWA manifest
│   ├── icons/
│   │   ├── icon-192.png               # Icone PWA 192x192
│   │   └── icon-512.png               # Icone PWA 512x512 (Eros)
│   └── silence.wav                    # Audio silencioso (iOS hack)
├── docs/                              # Documentacao
├── .env.local                         # Variaveis de ambiente
├── package.json                       # Dependencias
├── next.config.ts                     # Config Next.js
├── tsconfig.json                      # Config TypeScript
└── tailwind.config.ts                 # Config Tailwind (se houver)
```

---

## Fluxo da Aplicacao

### 1. Primeiro Acesso (nao logado)
```
Homepage (/) → Ve lenda com trechos bloqueados → Clica "Participar" → Login
```

### 2. Login → Dashboard
```
Login (/login) → Middleware valida auth → Dashboard (/dashboard)
→ Eros faz saudacao personalizada (TTS auto-play)
→ Lista etapas disponiveis
```

### 3. Respondendo uma Etapa
```
Dashboard → Clica etapa → /dashboard/etapa/[id]
→ Narrativa personalizada ({nome})
→ Pergunta + area de resposta
→ Submete resposta → POST /api/resposta
→ Pergunta de autorizacao (exibir resposta ao outro?)
→ Se outro ja respondeu: analise de compatibilidade
→ Se nao: tela de espera
→ 3 desejos disponiveis (chat com Eros) — bonus de +1 desejo se pedir mais
→ Dica flutuante disponivel (icone Eros)
```

### 4. Analise de Compatibilidade
```
Ambos responderam → POST /api/analyze
→ API busca respostas direto do banco (bypassa autorizacao de exibicao)
→ OpenAI analisa respostas
→ Retorna: intelectual%, emocional%, padroes, diferencas, resumo
→ Salva em indices + cria evento timeline
→ Etapa 3: tambem sugere atividade
→ Auto-recuperacao: se analise falhou, e retriggered ao revisitar a etapa
```

### 5. Resultado Final
```
6 etapas completas → POST /api/analyze/final
→ Gera resumo poetico final
→ Indice geral de conexao
→ Mensagem especial
→ Status sessao → "concluido"
```

---

## Middleware — Rotas Publicas vs Protegidas

**Rotas publicas (sem login):**
- `/` (homepage)
- `/login`
- `/auth/*`
- `/set-password`
- `/api/progresso-publico`
- `/api/etapas`
- Arquivos estaticos (`.png`, `.jpg`, `.svg`, `.json`, `.ico`, `.webp`, `.gif`)

**Rotas protegidas (requer login):**
- `/dashboard/*`
- `/admin`
- Todas as outras `/api/*`

---

## Banco de Dados — Tabelas

### profiles
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | = auth.users.id |
| nome | text | Nome completo |
| email | text | Email |
| created_at | timestamp | Data criacao |

### experiment_session
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | ID da sessao |
| user1_id | uuid (FK) | Participante 1 |
| user2_id | uuid (FK) | Participante 2 |
| etapa_atual | int | Etapa liberada (1-6) |
| status | text | 'ativo' ou 'concluido' |
| created_at | timestamp | Data criacao |

### respostas
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | ID da resposta |
| session_id | uuid (FK) | Sessao |
| user_id | uuid (FK) | Usuario |
| etapa | int | Numero da etapa |
| resposta | text | Texto da resposta |
| opcoes_selecionadas | jsonb | Opcoes (multipla escolha) |
| autorizar_exibicao | boolean | Permite outro ver? (default false) |
| criado_em | timestamp | Data |

### indices
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | |
| session_id | uuid (FK) | |
| etapa | int | |
| tipo_indice | text | curiosidade/intelectual/etc |
| valor_user1 | int | Score user 1 |
| valor_user2 | int | Score user 2 |
| compatibilidade | int | 0-100 |
| padroes_semelhantes | jsonb | Lista de padroes |
| diferencas_crescimento | jsonb | Lista de diferencas |
| resumo | text | Frase poetica |

### timeline
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | |
| session_id | uuid (FK) | |
| titulo | text | Titulo do evento |
| descricao | text | Descricao |
| tipo | text | Tipo do evento |
| data_evento | timestamp | Data |

### genie_interactions
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | |
| session_id | uuid (FK) | |
| user_id | uuid (FK) | |
| etapa | int | |
| interaction_number | int | 1 a 4 (com bonus) |
| pergunta | text | Pergunta do usuario |
| resposta | text | Resposta do Eros |

**CHECK constraint:** `interaction_number BETWEEN 1 AND 6`

### bonus_wishes
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | |
| session_id | uuid (FK) | Sessao do experimento |
| user_id | uuid (FK) | Usuario que recebeu bonus |
| etapa | int | Etapa onde o bonus foi concedido |
| granted_at | timestamp | Data da concessao |

**UNIQUE constraint:** `(session_id, user_id)` — bonus concedido apenas 1 vez por experimento.

### eros_hints
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | |
| session_id | uuid (FK) | |
| user_id | uuid (FK) | |
| etapa | int | |
| hint_text | text | Dica gerada |

### admin_context
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | |
| session_id | uuid (FK) | Pode ser null |
| user_id | uuid (FK) | Pode ser null (geral) |
| contexto | text | Texto livre |
| criado_em | timestamp | |

### etapas_config
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| numero | int (PK) | 1-6 |
| titulo | text | |
| subtitulo | text | |
| narrativa | text | Usa {nome} |
| pergunta | text | |
| tipo_resposta | text | 'texto' ou 'multipla_escolha' |
| max_caracteres | int | |
| opcoes | jsonb | Para multipla escolha |
| imagem_url | text | URL da imagem |
| tipo_indice | text | |

---

## Acesso Direto ao Banco

```bash
PGPASSWORD="1891SeNZiKUx43y2" psql "host=db.ljuhtcgldzuuagfeglvi.supabase.co port=6543 dbname=postgres user=postgres sslmode=require"
```

**Nota:** Usar porta `6543` (transaction mode). Porta 5432 nao aceita conexao direta.

---

## Notas Tecnicas

- **TTS no iOS:** Usa `silence.wav` hack para iniciar AudioContext antes do auto-play
- **Etapas dinamicas:** Carregadas do banco (`etapas_config`) com fallback para array hardcoded
- **RLS bypass:** Operacoes administrativas usam `createAdminClient()` com service role key
- **RLS nota:** Tabela `respostas` nao tem policy de UPDATE — endpoints que fazem update (como autorizar) devem usar admin client
- **Deteccao de criador:** Funcao `isPerguntaSobreCriador()` com 25+ padroes regex para detectar perguntas sobre quem criou Eros
- **Deteccao de bonus:** 12 padroes regex em `isAskingForMoreWishes()` para detectar pedidos de mais desejos em portugues
- **Bonus de desejos:** Ao pedir mais desejos dentro dos 3 primeiros, Eros concede +1 (total 4). Mensagem hardcoded. Concedido apenas 1 vez por experimento (tabela `bonus_wishes`)
- **Countdown timer:** Proxima etapa liberada as 20h do dia seguinte (`CountdownTimer` component)
- **Analise auto-recovery:** Se ambos responderam mas analise esta faltando, e triggerada automaticamente ao revisitar a etapa
- **Analise independente de autorizacao:** O `/api/analyze` busca respostas direto do banco com admin client, independente do toggle de autorizacao de exibicao
- **Sandbox admin:** Endpoint `/api/admin/test-genie` espelha logica do genie sem salvar dados no banco

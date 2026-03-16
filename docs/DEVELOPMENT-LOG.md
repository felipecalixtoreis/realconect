# realconect.com — Historico de Desenvolvimento

## Marco 2026

### Sessao 1 — Estrutura Base

**Funcionalidades implementadas:**

1. **Projeto Next.js 16 com App Router** — Criacao do projeto com TypeScript, Tailwind CSS 4, Supabase
2. **Sistema de autenticacao** — Login por email/senha via Supabase Auth + SSR
3. **Middleware de protecao de rotas** — Rotas publicas vs protegidas com redirect para /login
4. **Dashboard principal** — Lista de etapas com progresso, layout com gradiente escuro
5. **6 etapas do experimento** — Paginas dinamicas /dashboard/etapa/[id] com narrativa personalizada
6. **Submissao de respostas** — POST /api/resposta com suporte a texto e multipla escolha
7. **Autorizacao de exibicao** — Toggle para permitir que o outro participante veja a resposta
8. **Analise de compatibilidade** — OpenAI analisa respostas de ambos e gera indices
9. **Resultado final** — Resumo poetico apos 6 etapas completas
10. **Avatar Eros** — Componente animado com TTS via ElevenLabs
11. **Chat dos 3 desejos (Genie)** — 3 perguntas por etapa ao oraculo Eros
12. **Dica flutuante** — Botao com icone Eros que gera dica contextual
13. **Timeline** — Linha do tempo com eventos de descoberta
14. **Grafico de compatibilidade** — Visualizacao dos indices
15. **Gauge de coracao (HeartGauge)** — Indicador visual de conexao
16. **Homepage com lenda progressiva** — Trechos desbloqueados conforme progresso
17. **PWA** — Manifest, icones, prompt de instalacao
18. **Painel administrativo** — CRUD completo de sessoes, usuarios, respostas, etapas, contextos IA
19. **Set-password** — Pagina para Samira criar senha
20. **Contexto admin (admin_context)** — Perfis manuais para enriquecer respostas do Eros
21. **Sugestao de atividade** — Gerada na etapa 3 baseada em respostas

### Sessao 2 — Refinamentos e Personalizacao

**Correcoes:**

1. **Saudacao do Eros sempre mostrando mensagem de primeira vez**
   - Causa: API usava coluna `resposta_texto` (inexistente); correto e `resposta`
   - Correcao em: `src/app/api/eros-greeting/route.ts`

2. **Manifest.json com erro de sintaxe no console**
   - Causa: Middleware interceptava `/manifest.json` e redirecionava para `/login`
   - Correcao em: `src/middleware.ts` — adicionado `.json` e `manifest.json` ao matcher de exclusao

3. **Entrada duplicada no admin_context**
   - Causa: Perfil de Felipe inserido duas vezes manualmente
   - Correcao: DELETE via SQL direto no banco

**Melhorias:**

1. **Cursor pointer global** — CSS rule para todos elementos interativos (button, a, select, etc.)
   - Arquivo: `src/app/globals.css`

2. **Personalizacao profunda do Eros** — 4 fontes de dados:
   - Admin context (perfis manuais)
   - Respostas das etapas (`respostas`)
   - Perguntas dos 3 desejos (`genie_interactions`)
   - Historico do outro participante (`historicoOutro`)
   - Implementado em: `gerarSaudacaoEros`, `gerarDicaEros`, `chatComEros`

3. **Funcao `buscarHistoricoAcumulado()`** — Nova funcao em `src/lib/historico.ts` que busca respostas + desejos acumulados de um usuario

4. **Delete de contextos admin** — Botao de lixeira no painel admin + endpoint DELETE em `/api/admin/context`

5. **Documentacao completa** — Diretorio `/docs` com:
   - `ARCHITECTURE.md` — Visao geral, stack, estrutura, fluxo, banco de dados
   - `CREDENTIALS.md` — Todas as chaves, tokens, senhas de acesso
   - `PROMPTS.md` — Todos os prompts do Eros com parametros
   - `DEVELOPMENT-LOG.md` — Este arquivo

---

## Componentes Principais

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| ErosAvatar | `src/components/ErosAvatar.tsx` | Avatar animado + saudacao + TTS auto-play |
| ErosFloatingHint | `src/components/ErosFloatingHint.tsx` | Botao flutuante para dica do Eros |
| EtapaCard | `src/components/EtapaCard.tsx` | Card de pergunta/resposta por etapa |
| GenieChat | `src/components/GenieChat.tsx` | Chat dos 3 desejos com Eros |
| OracleOfEros | `src/components/OracleOfEros.tsx` | Visualizacao animada do oraculo |
| FinalResult | `src/components/FinalResult.tsx` | Tela de resultado final |
| CompatibilityChart | `src/components/CompatibilityChart.tsx` | Grafico de indices |
| HeartGauge | `src/components/HeartGauge.tsx` | Gauge visual de conexao |
| Timeline | `src/components/Timeline.tsx` | Linha do tempo de eventos |
| LoadingScreen | `src/components/LoadingScreen.tsx` | Tela de carregamento |
| InstallPWA | `src/components/InstallPWA.tsx` | Prompt de instalacao PWA |

---

## API Routes

| Rota | Metodo | Funcao |
|------|--------|--------|
| `/api/session` | GET | Sessao do usuario logado |
| `/api/resposta` | POST | Submissao de resposta |
| `/api/resposta/autorizar` | POST | Toggle autorizacao de exibicao |
| `/api/analyze` | POST | Analise de compatibilidade (+ sugestao na etapa 3) |
| `/api/analyze/final` | POST | Resumo final (6 etapas completas) |
| `/api/eros-greeting` | GET | Saudacao do Eros |
| `/api/eros-hint` | GET/POST | Dica do Eros (1 por etapa) |
| `/api/genie` | GET/POST | Chat dos 3 desejos |
| `/api/tts` | POST | Text-to-Speech via ElevenLabs |
| `/api/etapas` | GET | Config das etapas (publico) |
| `/api/progresso-publico` | GET | Progresso geral (publico) |
| `/api/auth/signout` | POST | Logout |
| `/api/admin/data` | GET | Dados gerais do admin |
| `/api/admin/session` | CRUD | Sessoes |
| `/api/admin/users` | CRUD | Usuarios |
| `/api/admin/respostas` | CRUD | Respostas |
| `/api/admin/context` | POST/DELETE | Contextos IA |
| `/api/admin/etapas` | CRUD | Config etapas |
| `/api/admin/send-reset` | POST | Enviar reset de senha |

---

## Cache e SessionStorage

A saudacao do Eros usa cache via `sessionStorage` para evitar chamadas repetidas a API:

**Chave:** `eros_greeted_{sessionId}_{etapaAtual}_{totalRespondidas}`

Para limpar: DevTools → Application → Session Storage → selecionar dominio → deletar entradas

---

## Notas Tecnicas

- **TTS no iOS:** Usa `silence.wav` hack para iniciar AudioContext antes do auto-play
- **Etapas dinamicas:** Carregadas do banco (`etapas_config`) com fallback para array hardcoded
- **RLS bypass:** Operacoes administrativas usam `createAdminClient()` com service role key
- **Deteccao de criador:** Funcao `isPerguntaSobreCriador()` com 25+ padroes regex para detectar perguntas sobre quem criou Eros

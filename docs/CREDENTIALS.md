# realconect.com — Credenciais e Acessos

> **IMPORTANTE:** As chaves e tokens reais estao em `.env.local` na raiz do projeto (nao versionado).
> Este arquivo documenta QUAIS credenciais existem e ONDE sao usadas — sem expor valores.

## Variaveis de Ambiente (.env.local)

### Supabase
| Variavel | Descricao |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase (`https://ljuhtcgldzuuagfeglvi.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anonima (publica, usada no client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (secreta, bypassa RLS) |

### OpenAI
| Variavel | Descricao |
|----------|-----------|
| `OPENAI_API_KEY` | Chave de API do projeto OpenAI (modelo `gpt-4o-mini`) |

### ElevenLabs (Text-to-Speech)
| Variavel | Descricao |
|----------|-----------|
| `ELEVENLABS_API_KEY` | Chave de API ElevenLabs |
| `ELEVENLABS_VOICE_ID` | ID da voz usada (`x6uRgOliu4lpcrqMH3s1`) |
| Modelo TTS | `eleven_multilingual_v2` |

---

## Acesso Direto ao Banco de Dados (PostgreSQL)

```bash
PGPASSWORD="<ver .env.local>" psql -h db.ljuhtcgldzuuagfeglvi.supabase.co -p 5432 -U postgres -d postgres
```

| Parametro | Valor |
|-----------|-------|
| Host | `db.ljuhtcgldzuuagfeglvi.supabase.co` |
| Porta | `5432` |
| Usuario | `postgres` |
| Senha | Ver `.env.local` ou painel Supabase |
| Database | `postgres` |

---

## GitHub

| Parametro | Valor |
|-----------|-------|
| Repositorio | `https://github.com/felipecalixtoreis/realconect.git` |
| Branch principal | `main` |

---

## Deploy (Vercel)

| Parametro | Valor |
|-----------|-------|
| URL de producao | `https://realconect.com` |
| Deploy automatico | Push no branch `main` |
| Framework | Next.js (auto-detectado) |

---

## Supabase Dashboard

| Parametro | Valor |
|-----------|-------|
| URL | `https://app.supabase.com/project/ljuhtcgldzuuagfeglvi` |
| Projeto | `ljuhtcgldzuuagfeglvi` |

---

## Clientes Supabase no Codigo

O projeto usa 3 clientes Supabase diferentes:

| Cliente | Arquivo | Uso |
|---------|---------|-----|
| Browser (anon) | `src/lib/supabase/client.ts` | Componentes client-side |
| Server (anon) | `src/lib/supabase/server.ts` | Server Components / API Routes (com cookies) |
| Admin (service_role) | `src/lib/supabase/admin.ts` | Bypassa RLS — operacoes administrativas |

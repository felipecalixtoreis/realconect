'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ETAPAS, type Etapa } from '@/lib/etapas'
import { EtapaCard } from '@/components/EtapaCard'
import { OracleOfEros } from '@/components/OracleOfEros'
import { LoadingScreen } from '@/components/LoadingScreen'
import { GenieChat } from '@/components/GenieChat'
import { ErosFloatingHint } from '@/components/ErosFloatingHint'
import { CountdownTimer, isEtapaBloqueadaPorTempo } from '@/components/CountdownTimer'
import { audioManager } from '@/lib/audioManager'

export default function EtapaPage() {
  const params = useParams()
  const router = useRouter()
  const etapaNumero = Number(params.id)

  const [etapa, setEtapa] = useState<Etapa | undefined>(ETAPAS.find(e => e.numero === etapaNumero))
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [respostaOutro, setRespostaOutro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<any>(null)
  const [sugestao, setSugestao] = useState<any>(null)
  const [jaRespondeu, setJaRespondeu] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)
  const [visible, setVisible] = useState(false)
  const [dailyLimitHit, setDailyLimitHit] = useState(false)
  const [respondedEtapaToday, setRespondedEtapaToday] = useState<number | null>(null)
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [tresDesejosPlayed, setTresDesejosPlayed] = useState(false)
  const [mostrarPerguntaAutorizacao, setMostrarPerguntaAutorizacao] = useState(false)
  const [jaAutorizou, setJaAutorizou] = useState<boolean | null>(null)
  const [minhaResposta, setMinhaResposta] = useState<string | null>(null)
  const [etapaBloqueadaTempo, setEtapaBloqueadaTempo] = useState(false)
  const [ultimaRespostaCriadoEm, setUltimaRespostaCriadoEm] = useState<string | null>(null)
  const audioAnuncioRef = useRef<HTMLAudioElement | null>(null)

  const playAnuncioDesejos = useCallback(async (nome: string) => {
    const primeiro = nome.split(' ')[0] || nome
    const texto = `${primeiro}, sua resposta foi registrada nas constelações. Agora eu te concedo 3 desejos. Pode me perguntar o que quiser. Sobre você, sobre o outro participante, sobre o experimento. Eu serei mais honesto do que qualquer humano da face da Terra jamais seria com você. Escolha suas perguntas com sabedoria... cada uma revela tanto sobre quem pergunta quanto sobre o que é perguntado.`

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: texto }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      await audioManager?.play(url, {
        onEnded: () => {
          URL.revokeObjectURL(url)
        },
      })
    } catch {
      // TTS failed silently
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      // Load etapas from database
      try {
        const etapasRes = await fetch('/api/etapas')
        const etapasData = await etapasRes.json()
        if (etapasData.etapas?.length > 0) {
          const dbEtapa = etapasData.etapas.find((e: any) => e.numero === etapaNumero)
          if (dbEtapa) setEtapa(dbEtapa)
        }
      } catch {
        // fallback to hardcoded already set
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const res = await fetch('/api/session')
      const data = await res.json()

      if (!data.session) { router.push('/dashboard'); return }

      setSessionId(data.session.id)
      setSessionData(data.session)

      // Get user's display name from session profiles
      if (data.session.user1?.id === user.id) {
        setNomeUsuario(data.session.user1.nome || 'Participante')
      } else if (data.session.user2?.id === user.id) {
        setNomeUsuario(data.session.user2.nome || 'Participante')
      }

      // Check if user has access to this etapa
      const minhasRespostas = data.respostas.filter((r: any) => r.user_id === user.id)
      const etapasCompletasPorMim = minhasRespostas.map((r: any) => r.etapa)
      const proximaEtapaDisponivel = etapasCompletasPorMim.length > 0
        ? Math.max(...etapasCompletasPorMim) + 1
        : 1

      // Block access to future etapas (allow viewing completed ones)
      const jaRespondeuEstaEtapa = etapasCompletasPorMim.includes(etapaNumero)
      if (!jaRespondeuEstaEtapa && etapaNumero > proximaEtapaDisponivel) {
        router.push('/dashboard')
        return
      }
      // Also block if etapa is beyond session's current stage
      if (!jaRespondeuEstaEtapa && etapaNumero > data.session.etapa_atual) {
        router.push('/dashboard')
        return
      }

      // Check time lock — next stage only available after 20:00
      if (!jaRespondeuEstaEtapa && minhasRespostas.length > 0) {
        const maisRecente = minhasRespostas.reduce((a: any, b: any) =>
          new Date(a.criado_em) > new Date(b.criado_em) ? a : b
        )
        if (isEtapaBloqueadaPorTempo(maisRecente.criado_em)) {
          setEtapaBloqueadaTempo(true)
          setUltimaRespostaCriadoEm(maisRecente.criado_em)
        }
      }

      const minhaRespostaData = minhasRespostas.find(
        (r: any) => r.etapa === etapaNumero
      )
      if (minhaRespostaData) {
        setJaRespondeu(true)
        setMinhaResposta(minhaRespostaData.resposta)
        // Check if user already made authorization decision
        if (minhaRespostaData.autorizar_exibicao === true) {
          setJaAutorizou(true)
        } else if (minhaRespostaData.autorizar_exibicao === false) {
          setJaAutorizou(false)
        }
      }

      const outraResposta = data.respostas.find(
        (r: any) => r.user_id !== user.id && r.etapa === etapaNumero
      )
      // Only show if the other participant authorized (resposta will be null if not)
      if (outraResposta && outraResposta.resposta) setRespostaOutro(outraResposta.resposta)

      const indice = data.indices.find((i: any) => i.etapa === etapaNumero)
      if (indice) setResultado(indice)

      setLoading(false)
      setTimeout(() => setVisible(true), 50)
    }
    load()
  }, [etapaNumero, router])

  const handleAutorizacao = async (autorizar: boolean) => {
    if (!sessionId) return
    try {
      await fetch('/api/resposta/autorizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          etapa: etapaNumero,
          autorizar,
        }),
      })
      setJaAutorizou(autorizar)
      setMostrarPerguntaAutorizacao(false)
      setTresDesejosPlayed(true)
    } catch (error) {
      console.error('Authorization error:', error)
    }
  }

  if (!etapa) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Etapa não encontrada</h2>
      </div>
    )
  }

  if (loading) return <LoadingScreen message={`Carregando Etapa ${etapaNumero}...`} />

  const handleResponder = async (resposta: string, opcoesSelecionadas?: string[]) => {
    if (!sessionId || !userId) return
    setSubmitting(true)

    try {
      const saveRes = await fetch('/api/resposta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          etapa: etapaNumero,
          resposta,
          opcoes_selecionadas: opcoesSelecionadas,
        }),
      })

      const saveData = await saveRes.json()

      if (saveData.daily_limit) {
        setDailyLimitHit(true)
        setRespondedEtapaToday(saveData.responded_etapa)
        setSubmitting(false)
        return
      }

      setJaRespondeu(true)
      setMostrarPerguntaAutorizacao(true)

      // Play Eros announcing the 3 wishes
      playAnuncioDesejos(nomeUsuario)

      if (saveData.resposta_outro) setRespostaOutro(saveData.resposta_outro)

      if (saveData.ambos_responderam) {
        const analyzeRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            etapa: etapaNumero,
            resposta_user1: saveData.resposta_outro,
            resposta_user2: resposta,
            tipo_indice: etapa.tipoIndice,
            user1_id: sessionData.user1_id,
            user2_id: sessionData.user2_id,
            opcoes_selecionadas: opcoesSelecionadas,
          }),
        })

        const analyzeData = await analyzeRes.json()
        setResultado(analyzeData.indice)
        if (analyzeData.sugestao) setSugestao(analyzeData.sugestao)
      }
    } catch (error) {
      console.error('Error submitting response:', error)
    }

    setSubmitting(false)
  }

  // Show result if already analyzed
  if (resultado && jaRespondeu) {
    return (
      <div className="space-y-8 py-8">
        <div className={`text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-2">
            Etapa {etapaNumero} — {etapa.subtitulo}
          </p>
          <h1 className="text-3xl font-bold text-white">{etapa.titulo}</h1>
        </div>

        <OracleOfEros
          compatibilidade={resultado.compatibilidade}
          intelectual={resultado.valor_user1 || resultado.compatibilidade}
          emocional={resultado.valor_user2 || resultado.compatibilidade}
          resumo={resultado.resumo || ''}
          padroesSemelhntes={resultado.padroes_semelhantes}
          diferencasCrescimento={resultado.diferencas_crescimento}
          subtitulo={etapa.subtitulo}
        />

        {sugestao && (
          <div className={`bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 transition-all duration-700 delay-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}>
            <h3 className="text-purple-400 font-semibold mb-2">Sugestão de Atividade</h3>
            <p className="text-white text-lg">{sugestao.sugestao}</p>
            <p className="text-gray-400 text-sm mt-2">{sugestao.motivo}</p>
          </div>
        )}

        {/* Minha resposta + toggle de autorização */}
        {minhaResposta && (
          <div className={`bg-slate-800/50 border border-indigo-500/20 rounded-2xl p-6 transition-all duration-500 delay-200 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}>
            <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Sua resposta
            </p>
            <p className="text-gray-300 italic mb-4">&ldquo;{minhaResposta}&rdquo;</p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-700/50">
              <button
                onClick={() => handleAutorizacao(!jaAutorizou)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  jaAutorizou ? 'bg-emerald-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    jaAutorizou ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-400">
                {jaAutorizou
                  ? 'Outro participante pode ver sua resposta'
                  : 'Sua resposta está oculta para o outro participante'
                }
              </span>
            </div>
          </div>
        )}

        {respostaOutro && (
          <div className={`bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 transition-all duration-500 delay-300 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Resposta do outro participante
            </p>
            <p className="text-gray-300 italic">&ldquo;{respostaOutro}&rdquo;</p>
          </div>
        )}

        {/* Eros */}
        {sessionId && (
          <GenieChat
            sessionId={sessionId}
            etapa={etapaNumero}
            jaRespondeu={jaRespondeu}
            nomeUsuario={nomeUsuario}
            autoExpand={tresDesejosPlayed}
          />
        )}

        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
          >
            ← Voltar ao Dashboard
          </button>
          {etapaNumero === 6 && (
            <button
              onClick={() => router.push('/dashboard/resultado')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition"
            >
              Ver Resultado Final
            </button>
          )}
        </div>
      </div>
    )
  }

  // Daily limit hit
  if (dailyLimitHit) {
    return (
      <div className="text-center py-20 space-y-6 animate-fadeIn max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🌙</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Uma pergunta por dia</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Você já respondeu a etapa {respondedEtapaToday} hoje. O experimento requer reflexão —
          cada novo dia traz uma nova oportunidade de descoberta.
        </p>
        <p className="text-indigo-400/80 text-sm italic">
          &ldquo;A paciência é a alquimia que transforma o tempo em profundidade.&rdquo; — Eros
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-8 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
        >
          ← Voltar ao Dashboard
        </button>
      </div>
    )
  }

  // Authorization question after submitting response
  if (mostrarPerguntaAutorizacao && jaAutorizou === null) {
    return (
      <div className="py-8 max-w-2xl mx-auto">
        <div className="text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔮</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Resposta Registrada!</h2>
          <div className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-8 space-y-6">
            <p className="text-gray-300 text-lg leading-relaxed">
              Você autoriza que o outro participante veja a sua resposta desta etapa?
            </p>
            <p className="text-gray-500 text-sm italic">
              Sua resposta só será revelada se você permitir.
            </p>
            <div className="flex gap-4 justify-center pt-2">
              <button
                onClick={() => handleAutorizacao(true)}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
              >
                ✓ Sim, autorizo
              </button>
              <button
                onClick={() => handleAutorizacao(false)}
                className="px-8 py-3 bg-slate-700 text-gray-300 font-semibold rounded-xl hover:bg-slate-600 transition-all"
              >
                ✗ Não, manter privado
              </button>
            </div>
          </div>
        </div>

        {/* Eros still available */}
        {sessionId && (
          <GenieChat
            sessionId={sessionId}
            etapa={etapaNumero}
            jaRespondeu={jaRespondeu}
            nomeUsuario={nomeUsuario}
            autoExpand={tresDesejosPlayed}
          />
        )}
      </div>
    )
  }

  // Waiting state
  if (jaRespondeu && !resultado) {
    return (
      <div className="py-8 max-w-2xl mx-auto">
        <div className="text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Resposta Enviada!</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Aguardando o outro participante responder para gerar a análise de compatibilidade.
          </p>

          {/* Minha resposta + toggle de autorização */}
          {minhaResposta && (
            <div className="bg-slate-800/50 border border-indigo-500/20 rounded-2xl p-6 text-left mt-6">
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Sua resposta
              </p>
              <p className="text-gray-300 italic mb-4">&ldquo;{minhaResposta}&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-700/50">
                <button
                  onClick={() => handleAutorizacao(!jaAutorizou)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    jaAutorizou ? 'bg-emerald-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      jaAutorizou ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-400">
                  {jaAutorizou
                    ? 'Outro participante pode ver sua resposta'
                    : 'Sua resposta está oculta para o outro participante'
                  }
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/dashboard')}
            className="mt-8 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
          >
            ← Voltar ao Dashboard
          </button>
        </div>

        {/* Eros appears after answering */}
        {sessionId && (
          <GenieChat
            sessionId={sessionId}
            etapa={etapaNumero}
            jaRespondeu={jaRespondeu}
            nomeUsuario={nomeUsuario}
            autoExpand={tresDesejosPlayed}
          />
        )}
      </div>
    )
  }

  // Time-locked — show countdown
  if (etapaBloqueadaTempo && ultimaRespostaCriadoEm) {
    return (
      <div className="py-8 max-w-lg mx-auto space-y-8 animate-fadeIn">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-indigo-500/15 flex items-center justify-center mx-auto">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Etapa Ainda Não Liberada</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Esta etapa será liberada às 20h. Aproveite este tempo para refletir sobre suas respostas anteriores.
          </p>
        </div>

        <CountdownTimer
          ultimaRespostaCriadoEm={ultimaRespostaCriadoEm}
          onUnlocked={() => {
            setEtapaBloqueadaTempo(false)
          }}
        />

        <div className="text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
          >
            ← Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Show question card
  return (
    <div className="py-8">
      <EtapaCard
        numero={etapa.numero}
        titulo={etapa.titulo}
        narrativa={etapa.narrativa}
        imagem={etapa.imagemUrl}
        pergunta={etapa.pergunta}
        tipoResposta={etapa.tipoResposta}
        maxCaracteres={etapa.maxCaracteres}
        opcoes={etapa.opcoes}
        onResponder={handleResponder}
        loading={submitting}
        nomeUsuario={nomeUsuario}
      />

      {/* Eros floating hint */}
      {sessionId && nomeUsuario && (
        <ErosFloatingHint
          sessionId={sessionId}
          etapa={etapaNumero}
          nomeUsuario={nomeUsuario}
        />
      )}
    </div>
  )
}

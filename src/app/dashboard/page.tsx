'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ETAPAS } from '@/lib/etapas'
import { Timeline } from '@/components/Timeline'
import { LoadingScreen } from '@/components/LoadingScreen'
import { ErosAvatar } from '@/components/ErosAvatar'
import { CountdownTimer, isEtapaBloqueadaPorTempo } from '@/components/CountdownTimer'
import { audioManager } from '@/lib/audioManager'

interface SessionData {
  session: any
  respostas: any[]
  indices: any[]
  timeline: any[]
}

export default function DashboardPage() {
  const [data, setData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [visible, setVisible] = useState(false)
  const [ultimaRespostaCriadoEm, setUltimaRespostaCriadoEm] = useState<string | null>(null)
  const [etapaBloqueada, setEtapaBloqueada] = useState(false)
  const [closureStatus, setClosureStatus] = useState<{ visitado_em: string | null; resposta: string | null } | null>(null)
  const [outroNome, setOutroNome] = useState('')
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const res = await fetch('/api/session')
      const sessionData = await res.json()

      // Get user's display name and the other participant's name
      if (sessionData.session) {
        if (sessionData.session.user1?.id === user.id) {
          setNomeUsuario(sessionData.session.user1.nome || 'Participante')
          setOutroNome(sessionData.session.user2?.nome || 'o outro participante')
        } else if (sessionData.session.user2?.id === user.id) {
          setNomeUsuario(sessionData.session.user2.nome || 'Participante')
          setOutroNome(sessionData.session.user1?.nome || 'o outro participante')
        }
      }

      // If session is encerrado, fetch closure visit status of the other user
      if (sessionData.session?.status === 'encerrado') {
        try {
          const closureRes = await fetch(`/api/experiment-closure/status?session_id=${sessionData.session.id}`)
          if (closureRes.ok) {
            const closureData = await closureRes.json()
            setClosureStatus(closureData)
          }
        } catch {}
      }

      // Calculate time lock based on user's last response
      if (sessionData.respostas && user) {
        const minhasResps = sessionData.respostas.filter((r: any) => r.user_id === user.id)
        if (minhasResps.length > 0) {
          // Find the most recent response
          const maisRecente = minhasResps.reduce((a: any, b: any) =>
            new Date(a.criado_em) > new Date(b.criado_em) ? a : b
          )
          setUltimaRespostaCriadoEm(maisRecente.criado_em)
          // Check if next stage is time-locked
          const bloqueada = isEtapaBloqueadaPorTempo(maisRecente.criado_em)
          setEtapaBloqueada(bloqueada)
        }
      }

      setData(sessionData)
      setLoading(false)
      setTimeout(() => setVisible(true), 50)
    }
    loadData()
  }, [router])

  if (loading) return <LoadingScreen message="Carregando seu experimento..." />

  if (!data?.session) {
    return (
      <div className="text-center py-20 animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🔬</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Aguardando Experimento</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Seu experimento ainda não foi configurado. Aguarde o organizador criar a sessão para vocês.
        </p>
      </div>
    )
  }

  const { session, respostas, indices, timeline } = data
  const minhasRespostas = respostas.filter(r => r.user_id === userId)
  const etapasCompletasPorMim = minhasRespostas.map(r => r.etapa)

  const proximaEtapa = etapasCompletasPorMim.length > 0
    ? Math.max(...etapasCompletasPorMim) + 1
    : 1

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className={`text-center py-8 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-2">
          Experimento em andamento
        </p>
        <h1 className="text-3xl font-bold text-white">Sua Jornada de Conexão</h1>
      </div>

      {/* Closure status indicator (only for Felipe when session is encerrado) */}
      {data.session.status === 'encerrado' && closureStatus && (
        <div
          className={`transition-all duration-700 delay-200 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <div className={`rounded-2xl p-5 border ${
            closureStatus.resposta
              ? 'bg-emerald-950/30 border-emerald-500/30'
              : closureStatus.visitado_em
              ? 'bg-amber-950/30 border-amber-500/30'
              : 'bg-slate-900/50 border-slate-700/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                closureStatus.resposta
                  ? 'bg-emerald-400 animate-pulse'
                  : closureStatus.visitado_em
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-600'
              }`} />
              <div className="flex-1">
                {closureStatus.resposta ? (
                  <>
                    <p className="text-emerald-300 text-sm font-semibold">
                      {outroNome} deixou palavras no Livro das Estrelas
                    </p>
                    <p className="text-emerald-200/60 text-xs mt-1">
                      Respondeu em {new Date(closureStatus.visitado_em!).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="mt-3 bg-slate-900/60 rounded-xl p-4 border border-emerald-500/10">
                      <p className="text-gray-300 text-sm italic leading-relaxed">&ldquo;{closureStatus.resposta}&rdquo;</p>
                    </div>
                  </>
                ) : closureStatus.visitado_em ? (
                  <>
                    <p className="text-amber-300 text-sm font-semibold">
                      {outroNome} visualizou a mensagem final de Eros
                    </p>
                    <p className="text-amber-200/60 text-xs mt-1">
                      Acessou em {new Date(closureStatus.visitado_em).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-amber-200/40 text-xs mt-1 italic">
                      Ainda não deixou palavras finais.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm font-semibold">
                      {outroNome} ainda não acessou o experimento
                    </p>
                    <p className="text-gray-500 text-xs mt-1 italic">
                      Você será notificado quando houver atividade.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Eros greeting */}
      {nomeUsuario && (
        <div
          className={`transition-all duration-700 delay-300 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <ErosAvatar
            nomeUsuario={nomeUsuario}
            etapaAtual={proximaEtapa}
            totalRespondidas={etapasCompletasPorMim.length}
            sessionId={session.id}
          />
        </div>
      )}

      {/* Stage cards - only show completed + current */}
      <div className="grid gap-4">
        {ETAPAS.filter(etapa => {
          // Show completed etapas + the next available one
          const respondida = etapasCompletasPorMim.includes(etapa.numero)
          const isProxima = etapa.numero === proximaEtapa && etapa.numero <= session.etapa_atual
          return respondida || isProxima
        }).map((etapa, index) => {
          const respondida = etapasCompletasPorMim.includes(etapa.numero)
          const temIndice = indices.find(i => i.etapa === etapa.numero)
          const isProxima = etapa.numero === proximaEtapa
          const isBloqueadaTempo = isProxima && !respondida && etapaBloqueada

          return (
            <div
              key={etapa.numero}
              className="transition-all duration-500"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: `${index * 100}ms`
              }}
            >
              <button
                onClick={() => {
                  if (isBloqueadaTempo) return
                  // Unlock audio on user gesture (iOS Safari requires this)
                  try { audioManager?.unlockFromGesture() } catch {}
                  router.push(`/dashboard/etapa/${etapa.numero}`)
                }}
                disabled={isBloqueadaTempo}
                className={`w-full text-left p-4 sm:p-6 rounded-2xl border transition-all ${
                  respondida
                    ? 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50'
                    : isBloqueadaTempo
                    ? 'bg-slate-900/40 border-slate-700/30 opacity-60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-slate-900/80 to-indigo-950/40 border-indigo-500/30 hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/10'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-lg font-bold flex-shrink-0 ${
                    respondida
                      ? 'bg-purple-500 text-white'
                      : isBloqueadaTempo
                      ? 'bg-slate-700 text-slate-400'
                      : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white animate-pulse'
                  }`}>
                    {respondida ? '✓' : isBloqueadaTempo ? '🔒' : etapa.numero}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">{etapa.subtitulo}</p>
                    <h3 className={`font-semibold text-base sm:text-lg truncate ${isBloqueadaTempo ? 'text-gray-500' : 'text-white'}`}>{etapa.titulo}</h3>
                    {temIndice && (
                      <p className="text-purple-400 text-xs sm:text-sm mt-1">Conexão: {temIndice.compatibilidade}%</p>
                    )}
                    {isProxima && !respondida && !isBloqueadaTempo && (
                      <p className="text-indigo-400 text-xs sm:text-sm mt-1 italic">Disponível agora</p>
                    )}
                    {isBloqueadaTempo && (
                      <p className="text-amber-400/60 text-xs sm:text-sm mt-1 italic">Aguardando liberação às 20h</p>
                    )}
                  </div>
                  {isProxima && !respondida && !isBloqueadaTempo && (
                    <span className="text-indigo-400 text-xl sm:text-2xl animate-pulse flex-shrink-0">→</span>
                  )}
                  {isBloqueadaTempo && (
                    <span className="text-amber-400/40 text-lg flex-shrink-0">🔒</span>
                  )}
                  {respondida && (
                    <span className="text-purple-500/50 text-xs sm:text-sm flex-shrink-0">Ver</span>
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Countdown timer or explanation */}
      {etapasCompletasPorMim.length > 0 && etapasCompletasPorMim.length < 6 && (
        <div className={`transition-all duration-700 delay-400 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}>
          {etapaBloqueada && ultimaRespostaCriadoEm ? (
            <CountdownTimer
              ultimaRespostaCriadoEm={ultimaRespostaCriadoEm}
              onUnlocked={() => {
                setEtapaBloqueada(false)
              }}
            />
          ) : (
            <div className="bg-indigo-950/30 border border-indigo-500/15 rounded-2xl p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-indigo-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-indigo-300/90 text-sm font-semibold mb-1.5">Por que uma etapa por dia?</h4>
                  <p className="text-indigo-200/50 text-xs sm:text-sm leading-relaxed">
                    Cada etapa é liberada às 20h. Cada sílaba, cada palavra e cada frase possui um significado e um objetivo. Deixe o tempo trabalhar por você.
                    <span className="text-indigo-400/60 italic"> Reflita.</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress indicator */}
      {etapasCompletasPorMim.length < 6 && (
        <div className={`text-center transition-all duration-700 delay-500 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}>
          <p className="text-gray-500 text-sm">
            Etapa {Math.min(etapasCompletasPorMim.length + 1, 6)} de 6
          </p>
          <div className="w-48 h-1 bg-slate-800 rounded-full mx-auto mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
              style={{ width: `${(etapasCompletasPorMim.length / 6) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <div
          className={`mt-12 transition-all duration-700 delay-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <h2 className="text-xl font-bold text-white mb-6">Linha do Tempo</h2>
          <Timeline
            items={timeline.map(t => ({
              data: new Date(t.data_evento).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
              titulo: t.titulo,
              descricao: t.descricao,
              tipo: t.tipo,
            }))}
          />
        </div>
      )}

      {/* Final result link */}
      {session.status === 'concluido' && (
        <div className={`text-center py-8 transition-all duration-700 delay-500 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}>
          <button
            onClick={() => router.push('/dashboard/resultado')}
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-105"
          >
            Ver Resultado Final
          </button>
        </div>
      )}
    </div>
  )
}

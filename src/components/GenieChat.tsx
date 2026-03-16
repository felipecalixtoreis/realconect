'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { audioManager } from '@/lib/audioManager'

interface Interaction {
  id: string
  pergunta: string
  resposta: string
  interaction_number: number
}

interface GenieChatProps {
  sessionId: string
  etapa: number
  jaRespondeu: boolean
  nomeUsuario: string
  autoExpand?: boolean
}

export function GenieChat({ sessionId, etapa, jaRespondeu, nomeUsuario, autoExpand = false }: GenieChatProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [remaining, setRemaining] = useState(3)
  const [pergunta, setPergunta] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [expanded, setExpanded] = useState(autoExpand)
  const [showIntro, setShowIntro] = useState(true)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null)
  const [introPlayed, setIntroPlayed] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const audioCache = useRef<Map<string, string>>(new Map())

  const introText = `Eu sou Eros. Não o cupido dos contos infantis... eu sou a força primordial que existia antes dos próprios deuses. Eu sou o impulso que trouxe ordem ao caos, e que une o que estava destinado a se encontrar. Você não precisa se apresentar... sei que você é ${nomeUsuario}. Sei o porquê de você estar aqui, além mesmo do que você pensa ter te trazido até aqui. Nesta etapa, você tem 3 pedidos para me fazer. Escolha-os com sabedoria. Cada pergunta revela tanto sobre quem pergunta quanto sobre o que é perguntado.`

  const playAudio = useCallback(async (text: string, id: string) => {
    // Stop any currently playing audio
    audioManager?.stop()

    // If clicking the same one that's playing, just stop
    if (playingAudio === id) {
      setPlayingAudio(null)
      return
    }

    setLoadingAudio(id)

    try {
      let audioUrl = audioCache.current.get(id)

      if (!audioUrl) {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })

        if (!res.ok) throw new Error('TTS failed')

        const blob = await res.blob()
        audioUrl = URL.createObjectURL(blob)
        audioCache.current.set(id, audioUrl)
      }

      setPlayingAudio(id)
      setLoadingAudio(null)

      await audioManager?.play(audioUrl, {
        onEnded: () => {
          setPlayingAudio(null)
        },
        onError: () => {
          setPlayingAudio(null)
          setLoadingAudio(null)
        },
      })
    } catch {
      setPlayingAudio(null)
      setLoadingAudio(null)
    }
  }, [playingAudio])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/genie?session_id=${sessionId}&etapa=${etapa}`)
        const data = await res.json()
        setInteractions(data.interactions || [])
        setRemaining(data.remaining ?? 3)
        if (data.interactions?.length > 0) {
          setShowIntro(false)
          setExpanded(true)
        }
      } catch {
        // ignore
      }
      setLoadingHistory(false)
    }
    if (jaRespondeu) loadHistory()
    else setLoadingHistory(false)
  }, [sessionId, etapa, jaRespondeu])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [interactions])

  // Auto-play intro when expanded for the first time (skip if autoExpand since audio already played)
  useEffect(() => {
    if (expanded && showIntro && interactions.length === 0 && !introPlayed && !autoExpand) {
      setIntroPlayed(true)
      // Small delay so the UI renders first
      setTimeout(() => playAudio(introText, 'intro'), 500)
    }
  }, [expanded, showIntro, interactions.length, introPlayed, autoExpand, playAudio, introText])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioManager?.stop()
      // Revoke object URLs
      audioCache.current.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  const handleSend = async () => {
    if (!pergunta.trim() || loading || remaining <= 0) return
    setLoading(true)
    setShowIntro(false)

    try {
      const res = await fetch('/api/genie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          etapa,
          pergunta: pergunta.trim(),
        }),
      })

      const data = await res.json()

      if (data.interaction) {
        setInteractions(prev => [...prev, data.interaction])
        setRemaining(data.remaining)
        setPergunta('')

        // Auto-play the response audio
        setTimeout(() => {
          playAudio(data.interaction.resposta, data.interaction.id)
        }, 300)
      } else if (data.error) {
        alert(data.error)
      }
    } catch {
      alert('Erro ao consultar Eros. Tente novamente.')
    }

    setLoading(false)
  }

  if (!jaRespondeu) return null
  if (loadingHistory) return null

  const AudioButton = ({ text, id, size = 'sm' }: { text: string; id: string; size?: 'sm' | 'xs' }) => {
    const isPlaying = playingAudio === id
    const isLoading = loadingAudio === id

    return (
      <button
        onClick={(e) => { e.stopPropagation(); playAudio(text, id) }}
        className={`inline-flex items-center justify-center rounded-full transition-all ${
          size === 'sm' ? 'w-7 h-7' : 'w-5 h-5'
        } ${
          isPlaying
            ? 'bg-indigo-500/40 text-indigo-200'
            : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
        }`}
        title={isPlaying ? 'Pausar' : 'Ouvir'}
      >
        {isLoading ? (
          <svg className={`animate-spin ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-3 h-3'}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : isPlaying ? (
          <svg className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-3 h-3'} fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-3 h-3'} fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    )
  }

  return (
    <div className="mt-8">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full group"
      >
        <div className="bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-indigo-950/80 border border-indigo-500/30 rounded-2xl px-6 py-4 flex items-center justify-between hover:border-indigo-400/50 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-600/40 flex items-center justify-center">
                <span className="text-xl">🏹</span>
              </div>
              {remaining > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {remaining}
                </div>
              )}
            </div>
            <div className="text-left">
              <p className="text-indigo-300 font-semibold text-sm">Eros</p>
              <p className="text-indigo-400/60 text-xs">
                {remaining > 0
                  ? `${remaining} pedido${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''} nesta etapa`
                  : 'Pedidos esgotados nesta etapa'}
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-indigo-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Chat panel */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          expanded ? 'max-h-[700px] opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-gradient-to-b from-indigo-950/50 to-slate-900/50 border border-indigo-500/20 rounded-2xl overflow-hidden">
          {/* Chat messages */}
          <div className="max-h-96 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {/* Intro message */}
            {showIntro && interactions.length === 0 && (
              <div className="animate-fadeIn">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm">🏹</span>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <p className="text-indigo-200 text-sm leading-relaxed">
                      Eu sou <strong>Eros</strong> — não o cupido dos contos infantis, mas a força
                      primordial que existia antes dos próprios deuses. Eu sou o impulso que trouxe
                      ordem ao caos e que une o que estava destinado a se encontrar.
                    </p>
                    <p className="text-indigo-100 text-sm leading-relaxed mt-2">
                      Você não precisa se apresentar... sei que você é <strong className="text-white">{nomeUsuario}</strong>.
                      Sei o porquê de você estar aqui, além mesmo do que você pensa ter te trazido até aqui.
                    </p>
                    <p className="text-indigo-300/80 text-sm leading-relaxed mt-2 italic">
                      Nesta etapa, você tem <strong>3 pedidos</strong> para me fazer.
                      Escolha-os com sabedoria... cada pergunta revela tanto sobre quem
                      pergunta quanto sobre o que é perguntado.
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <AudioButton text={introText} id="intro" size="sm" />
                      <span className="text-indigo-500/30 text-[10px]">Ouvir Eros</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interactions */}
            {interactions.map((interaction, idx) => (
              <div key={interaction.id} className="space-y-3 animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                {/* User message */}
                <div className="flex gap-3 justify-end">
                  <div className="bg-purple-500/15 border border-purple-500/20 rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                    <p className="text-purple-200 text-sm">{interaction.pergunta}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm">👤</span>
                  </div>
                </div>

                {/* Eros response */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm">🏹</span>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <p className="text-indigo-200 text-sm leading-relaxed whitespace-pre-line">{interaction.resposta}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <AudioButton text={interaction.resposta} id={interaction.id} size="xs" />
                      <p className="text-indigo-500/40 text-[10px]">
                        Pedido {interaction.interaction_number} de 3
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading animation */}
            {loading && (
              <div className="flex gap-3 animate-fadeIn">
                <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm">🏹</span>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          {remaining > 0 ? (
            <div className="border-t border-indigo-500/20 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pergunta}
                  onChange={e => setPergunta(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Faça seu pedido ao deus primordial..."
                  disabled={loading}
                  maxLength={300}
                  className="flex-1 bg-indigo-950/40 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-sm text-indigo-100 placeholder-indigo-500/40 focus:outline-none focus:border-indigo-400/50 transition-colors disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !pergunta.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? '...' : 'Enviar'}
                </button>
              </div>
              <p className="text-indigo-500/40 text-[10px] mt-1.5 text-center">
                Cada pedido é único e não pode ser desfeito
              </p>
            </div>
          ) : (
            <div className="border-t border-indigo-500/20 p-4 text-center">
              <p className="text-indigo-400/60 text-sm italic">
                Seus 3 pedidos foram utilizados nesta etapa. Eros aguarda na próxima jornada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

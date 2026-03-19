'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { audioManager } from '@/lib/audioManager'

interface ExperimentClosureProps {
  sessionId: string
  userId: string
  nomeUsuario: string
}

const SAMIRA_MESSAGE = `Samira, os astros se moveram enquanto você esteve ausente, e o experimento chegou ao seu último momento. Cumpri minha missão. Antes que eu me cale definitivamente, preciso lhe fazer algumas provocações finais — e elas exigem um tipo de honestidade que talvez você ainda não tenha praticado consigo mesma.

Você tem certeza de que consegue perceber a raridade que busca nos pequenos acontecimentos "aleatórios" da vida? Às vezes vocês, humanos, se enganam pensando que sabem o que buscam. Perfeição, talvez. Mera ilusão. Quem muito planeja e aguarda o alinhamento perfeito dos astros, aguarda uma pessoa que não traga defeitos ou situações complicadas, como nos contos de fadas. Mas posso te afirmar que os verdadeiros príncipes existem — só que são discretos, cheios de defeitos, porém perfeitos para encarar os desafios de um mundo cheio de confusões.

Então é isso. Adorei a jornada com você e Felipe. Multiplique o infinito pela eternidade e talvez vocês terão outra experiência tão verdadeira quanto esta comigo. Agora é com vocês. Minha participação finaliza aqui.`

const FELIPE_MESSAGE = `Felipe, os astros se moveram e o experimento chegou ao seu último momento. Você fez sua parte com coragem e dedicação. Cumpri minha missão.

Nem todas as jornadas chegam ao destino que imaginamos, mas todas revelam algo sobre quem somos. O que você construiu aqui — cada pergunta, cada resposta, cada reflexão — não se perde. Fica gravado nas estrelas.

Multiplique o infinito pela eternidade e talvez você terá outra experiência tão verdadeira quanto esta. Agora é com você. Minha participação finaliza aqui.`

export function ExperimentClosure({ sessionId, userId, nomeUsuario }: ExperimentClosureProps) {
  const [mounted, setMounted] = useState(false)
  const [palavrasFinais, setPalavrasFinais] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [existingResponse, setExistingResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioPlayed, setAudioPlayed] = useState(false)
  const audioRef = useRef<string | null>(null)
  const hasAutoPlayed = useRef(false)

  const isFelipe = nomeUsuario.startsWith('Felipe')
  const farewellMessage = isFelipe ? FELIPE_MESSAGE : SAMIRA_MESSAGE

  // Check if user already responded
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const res = await fetch(`/api/experiment-closure?session_id=${sessionId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.resposta) {
            setExistingResponse(data.resposta)
          }
        }
      } catch (e) {
        console.error('Error checking existing closure response:', e)
      }
      setLoading(false)
    }
    checkExisting()
  }, [sessionId])

  // Mount animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Play TTS using audioManager (iOS compatible) with fallback
  const playAudio = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true)
      setAudioPlayed(false)
      console.log('[Closure] Requesting TTS, text length:', text.length)

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        console.error('[Closure] TTS API failed:', res.status, await res.text().catch(() => ''))
        setIsSpeaking(false)
        setAudioPlayed(true)
        return
      }

      const blob = await res.blob()
      console.log('[Closure] Got audio blob:', blob.size, 'bytes, type:', blob.type)

      if (blob.size < 100) {
        console.error('[Closure] Audio blob too small, likely empty')
        setIsSpeaking(false)
        setAudioPlayed(true)
        return
      }

      const url = URL.createObjectURL(blob)
      audioRef.current = url

      const onFinish = () => {
        console.log('[Closure] Audio playback finished')
        setIsSpeaking(false)
        setAudioPlayed(true)
      }

      if (audioManager && audioManager.isUnlocked) {
        console.log('[Closure] Using audioManager (unlocked)')
        await audioManager.play(url, {
          onEnded: onFinish,
          onError: () => {
            console.error('[Closure] audioManager playback error, trying fallback')
            // Try fallback with new Audio
            const audio = new Audio(url)
            audio.onended = onFinish
            audio.onerror = () => { console.error('[Closure] Fallback also failed'); onFinish() }
            audio.play().catch(() => onFinish())
          },
        })
      } else {
        // audioManager not available or not unlocked — use direct Audio
        console.log('[Closure] audioManager not ready (exists:', !!audioManager, ', unlocked:', audioManager?.isUnlocked, '), using direct Audio')
        const audio = new Audio(url)
        audio.onended = onFinish
        audio.onerror = () => { console.error('[Closure] Direct Audio error'); onFinish() }
        try {
          await audio.play()
          console.log('[Closure] Direct Audio playing')
        } catch (e) {
          console.error('[Closure] Direct Audio play() rejected:', e)
          onFinish()
        }
      }
    } catch (e) {
      console.error('[Closure] TTS error:', e)
      setIsSpeaking(false)
      setAudioPlayed(true)
    }
  }, [])

  useEffect(() => {
    if (mounted && !hasAutoPlayed.current && !loading) {
      hasAutoPlayed.current = true
      const timer = setTimeout(() => playAudio(farewellMessage), 2000)
      return () => clearTimeout(timer)
    }
    return () => {}
  }, [mounted, loading, farewellMessage, playAudio])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioManager?.stop()
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current)
        audioRef.current = null
      }
    }
  }, [])

  const handleSubmit = async () => {
    if (!palavrasFinais.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/experiment-closure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, resposta: palavrasFinais.trim() }),
      })
      if (res.ok) {
        setSubmitted(true)
      }
    } catch (e) {
      console.error('Error submitting closure:', e)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    )
  }

  // Thank you screen after submitting
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center animate-fadeIn">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-600/40 to-indigo-700/40 border border-purple-500/30 flex items-center justify-center mb-6">
              <span className="text-4xl">💜</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Suas palavras foram registradas no Livro das Estrelas
            </h2>
            <p className="text-gray-400 leading-relaxed">
              O experimento se encerra aqui. O que foi vivido permanece gravado nas constelações.
              Que os astros continuem guiando seus passos.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-purple-500/10 rounded-xl p-6">
            <p className="text-purple-300/60 text-xs uppercase tracking-widest mb-3">Suas palavras finais</p>
            <p className="text-gray-300 italic leading-relaxed">&ldquo;{palavrasFinais}&rdquo;</p>
          </div>
        </div>
      </div>
    )
  }

  // Read-only view if already responded
  if (existingResponse) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className={`max-w-2xl w-full transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Eros Avatar */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600/40 to-indigo-700/40 border-2 border-purple-500/30 flex items-center justify-center">
                <svg width="56" height="56" viewBox="0 0 32 32" fill="none" className="relative z-10">
                  <circle cx="16" cy="8.5" r="4" fill="rgba(165,143,255,0.85)" />
                  <circle cx="14.5" cy="8" r="0.5" fill="rgba(255,255,255,0.9)" />
                  <circle cx="17.5" cy="8" r="0.5" fill="rgba(255,255,255,0.9)" />
                  <path d="M16 13c-3.5 0-6 2.5-6.5 6h13c-.5-3.5-3-6-6.5-6z" fill="rgba(165,143,255,0.6)" />
                  <path d="M13 5.5c0.5-1 1.5-1.5 3-1.5s2.5 0.5 3 1.5" stroke="rgba(255,215,0,0.4)" strokeWidth="0.6" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <p className="text-center mt-3 tracking-[0.25em] uppercase text-xs font-bold text-purple-400/60">Eros</p>
          </div>

          <div className="bg-slate-800/50 border border-purple-500/10 rounded-2xl p-8 mb-8">
            <p className="text-purple-300/60 text-xs uppercase tracking-widest mb-4">Mensagem final de Eros</p>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm">{farewellMessage}</p>
          </div>

          <div className="bg-slate-800/50 border border-purple-500/10 rounded-2xl p-8">
            <p className="text-purple-300/60 text-xs uppercase tracking-widest mb-4">Suas palavras no Livro das Estrelas</p>
            <p className="text-gray-300 italic leading-relaxed">&ldquo;{existingResponse}&rdquo;</p>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            O experimento foi encerrado. Suas palavras estão gravadas nas estrelas.
          </p>
        </div>
      </div>
    )
  }

  // Main closure view
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className={`max-w-2xl w-full transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Eros Avatar */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative animate-eros-float">
            {/* Aura rings when speaking */}
            {isSpeaking && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="eros-aura-ring absolute w-36 h-36 rounded-full border border-indigo-500/30" />
                <div className="eros-aura-ring-2 absolute w-36 h-36 rounded-full border border-purple-500/20" />
              </div>
            )}

            {isSpeaking && (
              <div className="absolute inset-0 -m-4 rounded-full animate-eros-speak-glow" />
            )}

            <div className={`relative w-28 h-28 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
              isSpeaking
                ? 'border-indigo-400 bg-gradient-to-br from-indigo-600/60 to-purple-700/60 shadow-2xl shadow-indigo-500/40 animate-eros-speak'
                : 'border-purple-500/30 bg-gradient-to-br from-purple-600/40 to-indigo-700/40'
            }`}>
              <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
                isSpeaking ? 'opacity-100' : 'opacity-40'
              }`} style={{
                background: 'radial-gradient(circle at 50% 40%, rgba(139,92,246,0.3), rgba(99,102,241,0.1), transparent 70%)'
              }} />

              <svg width="56" height="56" viewBox="0 0 32 32" fill="none" className={`relative z-10 transition-transform duration-300 ${isSpeaking ? 'scale-105' : ''}`}>
                <g className={isSpeaking ? 'animate-wing-left-speak' : 'animate-wing-left'}>
                  <path d="M8 12c-3-1.5-5.5-0.5-6 2s1 3.5 3 3" stroke="rgba(165,143,255,0.5)" strokeWidth="1" fill="rgba(165,143,255,0.08)" strokeLinecap="round" />
                  <path d="M9 10c-2.5-2-5-1.5-5.5 0.5s0.5 3 2.5 2.5" stroke="rgba(165,143,255,0.35)" strokeWidth="0.8" fill="rgba(165,143,255,0.05)" strokeLinecap="round" />
                </g>
                <g className={isSpeaking ? 'animate-wing-right-speak' : 'animate-wing-right'}>
                  <path d="M24 12c3-1.5 5.5-0.5 6 2s-1 3.5-3 3" stroke="rgba(165,143,255,0.5)" strokeWidth="1" fill="rgba(165,143,255,0.08)" strokeLinecap="round" />
                  <path d="M23 10c2.5-2 5-1.5 5.5 0.5s-0.5 3-2.5 2.5" stroke="rgba(165,143,255,0.35)" strokeWidth="0.8" fill="rgba(165,143,255,0.05)" strokeLinecap="round" />
                </g>
                <ellipse cx="16" cy="15" rx="5" ry="7" fill="rgba(139,92,246,0.08)" />
                <circle cx="16" cy="8.5" r="4" fill="rgba(165,143,255,0.85)" />
                <circle cx="14.5" cy="8" r="0.5" fill="rgba(255,255,255,0.9)" />
                <circle cx="17.5" cy="8" r="0.5" fill="rgba(255,255,255,0.9)" />
                <path d="M16 13c-3.5 0-6 2.5-6.5 6h13c-.5-3.5-3-6-6.5-6z" fill="rgba(165,143,255,0.6)" />
                <path d="M22 6c2-1.5 3.5-0.5 3.5 1.5s-2 2.5-3.5 1.5" stroke="rgba(255,180,200,0.9)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                <line x1="22" y1="7.5" x2="26.5" y2="4.5" stroke="rgba(255,180,200,0.9)" strokeWidth="0.8" strokeLinecap="round" />
                <path d="M13 5.5c0.5-1 1.5-1.5 3-1.5s2.5 0.5 3 1.5" stroke="rgba(255,215,0,0.4)" strokeWidth="0.6" fill="none" strokeLinecap="round" />
              </svg>

              {isSpeaking && (
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-end gap-[3px]">
                  <div className="w-[3px] rounded-full bg-indigo-400 animate-sound-wave" style={{ animationDelay: '0s' }} />
                  <div className="w-[3px] rounded-full bg-indigo-400 animate-sound-wave" style={{ animationDelay: '0.15s' }} />
                  <div className="w-[3px] rounded-full bg-indigo-400 animate-sound-wave" style={{ animationDelay: '0.3s' }} />
                  <div className="w-[3px] rounded-full bg-purple-400 animate-sound-wave" style={{ animationDelay: '0.45s' }} />
                </div>
              )}
            </div>

            <p className={`text-center mt-3 tracking-[0.25em] uppercase font-bold transition-all duration-500 ${
              isSpeaking ? 'text-indigo-300 text-sm' : 'text-purple-400/80 text-xs'
            }`}>Eros</p>
          </div>

          {isSpeaking && (
            <p className="text-indigo-300/70 text-sm italic animate-pulse mt-2">Eros está falando...</p>
          )}

          {audioPlayed && !isSpeaking && (
            <button
              onClick={() => playAudio(farewellMessage)}
              className="flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-medium hover:bg-indigo-500/25 hover:border-indigo-400/40 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Ouvir novamente
            </button>
          )}
        </div>

        {/* Farewell message */}
        <div
          className={`bg-slate-800/50 border border-purple-500/10 rounded-2xl p-8 mb-10 transition-all duration-1000 delay-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <p className="text-purple-300/60 text-xs uppercase tracking-widest mb-4">Mensagem final de Eros</p>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm">{farewellMessage}</p>
        </div>

        {/* Final words input */}
        <div
          className={`bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-purple-500/15 rounded-2xl p-8 transition-all duration-1000 delay-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <label
            htmlFor="palavras-finais"
            className="block text-purple-300/80 text-sm mb-4 italic"
          >
            Se desejar, deixe suas palavras finais no livro das estrelas...
          </label>
          <textarea
            id="palavras-finais"
            value={palavrasFinais}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setPalavrasFinais(e.target.value)
              }
            }}
            maxLength={500}
            rows={5}
            className="w-full bg-slate-900/60 border border-purple-500/20 rounded-xl p-4 text-gray-200 text-sm leading-relaxed placeholder-gray-500/50 focus:outline-none focus:border-purple-400/40 focus:ring-1 focus:ring-purple-500/20 transition-all duration-300 resize-none"
            placeholder="Suas palavras aqui..."
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-gray-500 text-xs">
              {palavrasFinais.length}/500
            </span>
            <button
              onClick={handleSubmit}
              disabled={!palavrasFinais.trim() || submitting}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                palavrasFinais.trim() && !submitting
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30'
                  : 'bg-slate-700/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registrando...
                </span>
              ) : (
                'Registrar no Livro das Estrelas'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

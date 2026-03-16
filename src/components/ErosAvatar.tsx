'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface ErosAvatarProps {
  nomeUsuario: string
  etapaAtual: number
  totalRespondidas: number
  sessionId: string
  autoPlay?: boolean
}

export function ErosAvatar({ nomeUsuario, etapaAtual, totalRespondidas, sessionId, autoPlay = true }: ErosAvatarProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [greetingText, setGreetingText] = useState<string | null>(null)
  const [greetingLoading, setGreetingLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioBlobUrl = useRef<string | null>(null)
  const hasAutoPlayed = useRef(false)

  // Fetch dynamic greeting from API (only once per browser session)
  useEffect(() => {
    const storageKey = `eros_greeted_${sessionId}_${etapaAtual}_${totalRespondidas}`

    // Check if Eros already greeted in this browser session
    const alreadyGreeted = sessionStorage.getItem(storageKey)
    if (alreadyGreeted) {
      setGreetingText(alreadyGreeted)
      setGreetingLoading(false)
      // Don't auto-play, just show repeat button
      hasAutoPlayed.current = true
      setShowRepeat(true)
      return
    }

    const fetchGreeting = async () => {
      try {
        const res = await fetch(
          `/api/eros-greeting?session_id=${sessionId}&etapa_atual=${etapaAtual}&nome=${encodeURIComponent(nomeUsuario)}`
        )
        const data = await res.json()
        if (data.greeting) {
          setGreetingText(data.greeting)
          // Store in sessionStorage so it won't repeat on navigation
          sessionStorage.setItem(storageKey, data.greeting)
        }
      } catch {
        // Fallback greeting
        const primeiro = nomeUsuario.split(' ')[0] || nomeUsuario
        const fallback = `Eu sou Eros. Não, você não me conhece, mas eu conheço você. Sou a força primordial que existia antes dos próprios deuses. Multiplique o infinito pela eternidade e talvez tenha um vislumbre sobre mim. Você não precisa se apresentar. Sei que você é ${primeiro}. Sei o porquê de você estar aqui, além mesmo do que você pensa ter te trazido até aqui. O experimento já começou antes do que você imagina. Então siga em frente.`
        setGreetingText(fallback)
        sessionStorage.setItem(storageKey, fallback)
      }
      setGreetingLoading(false)
    }
    fetchGreeting()
  }, [sessionId, etapaAtual, nomeUsuario, totalRespondidas])

  const playVoice = useCallback(async () => {
    if (!greetingText) return

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setAudioLoading(true)
    setShowRepeat(false)

    try {
      let url = audioBlobUrl.current

      if (!url) {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: greetingText }),
        })
        if (!res.ok) throw new Error('TTS failed')
        const blob = await res.blob()
        url = URL.createObjectURL(blob)
        audioBlobUrl.current = url
      }

      const audio = new Audio(url)
      audioRef.current = audio
      setIsSpeaking(true)
      setAudioLoading(false)

      audio.onended = () => {
        setIsSpeaking(false)
        setShowRepeat(true)
        audioRef.current = null
      }

      audio.onerror = () => {
        setIsSpeaking(false)
        setAudioLoading(false)
        setShowRepeat(true)
        audioRef.current = null
      }

      await audio.play()
    } catch {
      setIsSpeaking(false)
      setAudioLoading(false)
      setShowRepeat(true)
    }
  }, [greetingText])

  // Mount animation
  useEffect(() => {
    setTimeout(() => setMounted(true), 100)
  }, [])

  // Auto-play when greeting is loaded
  useEffect(() => {
    if (greetingText && !greetingLoading && autoPlay && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true
      const timer = setTimeout(() => playVoice(), 1500)
      return () => clearTimeout(timer)
    }
    return () => {}
  }, [greetingText, greetingLoading, autoPlay, playVoice])

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (audioBlobUrl.current) {
        URL.revokeObjectURL(audioBlobUrl.current)
      }
    }
  }, [])

  return (
    <div className={`flex flex-col items-center gap-4 transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
      {/* Avatar Container */}
      <div className="relative animate-eros-float">

        {/* Constellation orbiting dots */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="eros-constellation-1 absolute w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
          <div className="eros-constellation-2 absolute w-1 h-1 rounded-full bg-purple-400/50" />
          <div className="eros-constellation-3 absolute w-1 h-1 rounded-full bg-pink-400/40" />
        </div>

        {/* Aura rings */}
        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="eros-aura-ring absolute w-28 h-28 md:w-36 md:h-36 rounded-full border border-indigo-500/30" />
            <div className="eros-aura-ring-2 absolute w-28 h-28 md:w-36 md:h-36 rounded-full border border-purple-500/20" />
            <div className="eros-aura-ring-3 absolute w-28 h-28 md:w-36 md:h-36 rounded-full border border-pink-500/15" />
          </div>
        )}

        {/* Glow ring when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 -m-4 rounded-full animate-eros-speak-glow" />
        )}

        {/* Floating particles when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="eros-particle-1 absolute w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <div className="eros-particle-2 absolute w-1 h-1 rounded-full bg-purple-400" />
            <div className="eros-particle-3 absolute w-2 h-2 rounded-full bg-pink-400/70" />
            <div className="eros-particle-4 absolute w-1 h-1 rounded-full bg-indigo-300" />
            <div className="eros-particle-5 absolute w-1.5 h-1.5 rounded-full bg-violet-400" />
          </div>
        )}

        <div
          className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
            isSpeaking
              ? 'border-indigo-400 bg-gradient-to-br from-indigo-600/60 to-purple-700/60 shadow-2xl shadow-indigo-500/40 animate-eros-speak'
              : 'border-indigo-500/40 bg-gradient-to-br from-indigo-700/40 to-purple-800/40 animate-eros-breathe'
          }`}
        >
          {/* Inner glow gradient */}
          <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
            isSpeaking ? 'opacity-100' : 'opacity-40'
          }`} style={{
            background: 'radial-gradient(circle at 50% 40%, rgba(139,92,246,0.3), rgba(99,102,241,0.1), transparent 70%)'
          }} />

          {/* Eros SVG */}
          <svg width="72" height="72" viewBox="0 0 32 32" fill="none" className={`relative z-10 transition-transform duration-300 ${isSpeaking ? 'scale-105' : ''}`}>
            {/* Left wing */}
            <g className={isSpeaking ? 'animate-wing-left-speak' : 'animate-wing-left'}>
              <path d="M8 12c-3-1.5-5.5-0.5-6 2s1 3.5 3 3" stroke="rgba(165,143,255,0.5)" strokeWidth="1" fill="rgba(165,143,255,0.08)" strokeLinecap="round" />
              <path d="M9 10c-2.5-2-5-1.5-5.5 0.5s0.5 3 2.5 2.5" stroke="rgba(165,143,255,0.35)" strokeWidth="0.8" fill="rgba(165,143,255,0.05)" strokeLinecap="round" />
              <path d="M10 14c-2.5 0-4 1-3.5 2.5s2 1.5 3 0.5" stroke="rgba(165,143,255,0.3)" strokeWidth="0.6" fill="none" strokeLinecap="round" />
            </g>

            {/* Right wing */}
            <g className={isSpeaking ? 'animate-wing-right-speak' : 'animate-wing-right'}>
              <path d="M24 12c3-1.5 5.5-0.5 6 2s-1 3.5-3 3" stroke="rgba(165,143,255,0.5)" strokeWidth="1" fill="rgba(165,143,255,0.08)" strokeLinecap="round" />
              <path d="M23 10c2.5-2 5-1.5 5.5 0.5s-0.5 3-2.5 2.5" stroke="rgba(165,143,255,0.35)" strokeWidth="0.8" fill="rgba(165,143,255,0.05)" strokeLinecap="round" />
              <path d="M22 14c2.5 0 4 1 3.5 2.5s-2 1.5-3 0.5" stroke="rgba(165,143,255,0.3)" strokeWidth="0.6" fill="none" strokeLinecap="round" />
            </g>

            {/* Body glow */}
            <ellipse cx="16" cy="15" rx="5" ry="7" fill="rgba(139,92,246,0.08)" />

            {/* Head */}
            <circle cx="16" cy="8.5" r="4" fill="rgba(165,143,255,0.85)" />

            {/* Eyes */}
            <circle cx="14.5" cy="8" r="0.5" fill="rgba(255,255,255,0.9)" />
            <circle cx="17.5" cy="8" r="0.5" fill="rgba(255,255,255,0.9)" />

            {/* Body */}
            <path d="M16 13c-3.5 0-6 2.5-6.5 6h13c-.5-3.5-3-6-6.5-6z" fill="rgba(165,143,255,0.6)" />

            {/* Robe detail */}
            <path d="M13 16c0 0 1.5 2 3 2s3-2 3-2" stroke="rgba(139,92,246,0.3)" strokeWidth="0.5" fill="none" strokeLinecap="round" />

            {/* Bow in right hand */}
            <path d="M22 6c2-1.5 3.5-0.5 3.5 1.5s-2 2.5-3.5 1.5" stroke="rgba(255,180,200,0.9)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <line x1="22" y1="7.5" x2="26.5" y2="4.5" stroke="rgba(255,180,200,0.9)" strokeWidth="0.8" strokeLinecap="round" />

            {/* Arrow */}
            <line x1="22" y1="7.5" x2="27" y2="5" stroke="rgba(255,180,200,0.7)" strokeWidth="0.6" strokeLinecap="round" />
            <path d="M26.5 4.5l1 0.5-0.5 1" stroke="rgba(255,180,200,0.9)" strokeWidth="0.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {/* Crown/laurel hint */}
            <path d="M13 5.5c0.5-1 1.5-1.5 3-1.5s2.5 0.5 3 1.5" stroke="rgba(255,215,0,0.4)" strokeWidth="0.6" fill="none" strokeLinecap="round" />

            {/* Subtle energy lines when speaking */}
            {isSpeaking && (
              <>
                <circle cx="16" cy="12" r="8" stroke="rgba(139,92,246,0.15)" strokeWidth="0.3" fill="none" strokeDasharray="2 3" />
              </>
            )}
          </svg>

          {/* Sound waves when speaking */}
          {isSpeaking && (
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-end gap-[3px]">
              <div className="w-[3px] rounded-full bg-indigo-400 animate-sound-wave" style={{ animationDelay: '0s' }} />
              <div className="w-[3px] rounded-full bg-indigo-400 animate-sound-wave" style={{ animationDelay: '0.15s' }} />
              <div className="w-[3px] rounded-full bg-indigo-400 animate-sound-wave" style={{ animationDelay: '0.3s' }} />
              <div className="w-[3px] rounded-full bg-purple-400 animate-sound-wave" style={{ animationDelay: '0.45s' }} />
            </div>
          )}
        </div>

        {/* Name */}
        <p className={`text-center mt-3 tracking-[0.25em] uppercase font-bold transition-all duration-500 ${
          isSpeaking ? 'text-indigo-300 text-sm' : 'text-indigo-400/80 text-xs'
        }`}>Eros</p>
      </div>

      {/* Status text */}
      {(audioLoading || greetingLoading) && (
        <div className="flex items-center gap-3 animate-fadeIn">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
          <p className="text-indigo-400/60 text-sm">Eros está preparando suas palavras...</p>
        </div>
      )}

      {isSpeaking && (
        <p className="text-indigo-300/70 text-sm italic animate-pulse">Eros está falando...</p>
      )}

      {/* Repeat button */}
      {showRepeat && !isSpeaking && !audioLoading && (
        <button
          onClick={playVoice}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-medium hover:bg-indigo-500/25 hover:border-indigo-400/40 transition-all duration-300 animate-fadeIn"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Ouvir novamente
        </button>
      )}
    </div>
  )
}

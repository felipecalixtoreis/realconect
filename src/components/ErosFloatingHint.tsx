'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { audioManager } from '@/lib/audioManager'

interface ErosFloatingHintProps {
  sessionId: string
  etapa: number
  nomeUsuario: string
}

export function ErosFloatingHint({ sessionId, etapa, nomeUsuario }: ErosFloatingHintProps) {
  const [hintUsed, setHintUsed] = useState(false)
  const [hintText, setHintText] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [hasHeardOnce, setHasHeardOnce] = useState(false)
  const audioBlobUrl = useRef<string | null>(null)
  const repeatAudioUrl = useRef<string | null>(null)

  const REPEAT_MESSAGE = 'A dica já foi dada, agora você precisa ter coragem e responder com o que vem ao seu coração.'

  // Check if hint was already used
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`/api/eros-hint?session_id=${sessionId}&etapa=${etapa}`)
        const data = await res.json()
        if (data.used) {
          setHintUsed(true)
          setHintText(data.hint)
          setShowRepeat(true)
          setHasHeardOnce(true)
        }
      } catch {
        // ignore
      }
      setLoaded(true)
    }
    check()
  }, [sessionId, etapa])

  const playAudio = useCallback(async (text: string, isRepeat = false) => {
    // Stop any currently playing audio
    audioManager?.stop()

    setAudioLoading(true)
    setShowRepeat(false)

    try {
      const urlRef = isRepeat ? repeatAudioUrl : audioBlobUrl
      let url = urlRef.current

      if (!url) {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })
        if (!res.ok) throw new Error('TTS failed')
        const blob = await res.blob()
        url = URL.createObjectURL(blob)
        urlRef.current = url
      }

      setIsSpeaking(true)
      setAudioLoading(false)

      await audioManager?.play(url, {
        onEnded: () => {
          setIsSpeaking(false)
          setShowRepeat(true)
        },
        onError: () => {
          setIsSpeaking(false)
          setAudioLoading(false)
          setShowRepeat(true)
        },
      })
    } catch {
      setIsSpeaking(false)
      setAudioLoading(false)
      setShowRepeat(true)
    }
  }, [])

  const handleClick = async () => {
    // If already speaking, pause
    if (isSpeaking) {
      audioManager?.stop()
      setIsSpeaking(false)
      setShowRepeat(true)
      return
    }

    // If hint was used and we have text — always replay the hint text
    if (hintUsed && hintText) {
      setHasHeardOnce(true)
      playAudio(hintText)
      return
    }

    // If hint not used yet, get one
    if (!hintUsed) {
      setAudioLoading(true)
      try {
        const res = await fetch('/api/eros-hint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, etapa }),
        })
        const data = await res.json()
        if (data.hint) {
          setHintText(data.hint)
          setHintUsed(true)
          setHasHeardOnce(true)
          playAudio(data.hint)
        }
      } catch {
        setAudioLoading(false)
      }
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioBlobUrl.current) URL.revokeObjectURL(audioBlobUrl.current)
      if (repeatAudioUrl.current) URL.revokeObjectURL(repeatAudioUrl.current)
    }
  }, [])

  if (!loaded) return null

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 flex flex-col items-center gap-2">
      {/* Tooltip — always visible on first load if hint not used */}
      {(showTooltip || (!hintUsed && !isSpeaking && !audioLoading)) && (
        <div className="animate-fadeIn bg-indigo-950/90 border border-indigo-500/30 rounded-xl px-4 py-2 text-xs text-indigo-200 max-w-[180px] text-center backdrop-blur-sm shadow-lg shadow-indigo-500/20">
          {hintUsed
            ? 'Consultar Eros'
            : 'Pedir uma dica a Eros'}
        </div>
      )}

      {/* Speaking status */}
      {isSpeaking && (
        <div className="animate-fadeIn bg-indigo-950/90 border border-indigo-500/30 rounded-xl px-4 py-2 text-xs text-indigo-300 backdrop-blur-sm italic">
          Eros sussurra...
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={audioLoading}
        className={`relative animate-eros-float-small transition-all duration-300 ${
          audioLoading ? 'opacity-60' : ''
        }`}
      >
        {/* Aura rings when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="eros-aura-ring absolute w-14 h-14 md:w-16 md:h-16 rounded-full border border-indigo-500/30" />
            <div className="eros-aura-ring-2 absolute w-14 h-14 md:w-16 md:h-16 rounded-full border border-purple-500/20" />
          </div>
        )}

        {/* Glow when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 -m-3 rounded-full animate-eros-speak-glow" />
        )}

        {/* Particles when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="eros-particle-1 absolute w-1 h-1 rounded-full bg-indigo-400" />
            <div className="eros-particle-2 absolute w-1 h-1 rounded-full bg-purple-400" />
            <div className="eros-particle-3 absolute w-1 h-1 rounded-full bg-pink-400/70" />
          </div>
        )}

        <div className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
          isSpeaking
            ? 'border-indigo-400 bg-gradient-to-br from-indigo-600/70 to-purple-700/70 shadow-xl shadow-indigo-500/40 animate-eros-speak'
            : hintUsed
            ? 'border-indigo-500/30 bg-gradient-to-br from-indigo-800/40 to-purple-900/40 hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/20 animate-eros-breathe shadow-lg shadow-indigo-500/10'
            : 'border-indigo-400/60 bg-gradient-to-br from-indigo-600/60 to-purple-700/60 hover:border-indigo-400/80 shadow-xl shadow-indigo-500/30 animate-pulse'
        }`}>
          {/* Inner glow */}
          <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
            isSpeaking ? 'opacity-100' : 'opacity-30'
          }`} style={{
            background: 'radial-gradient(circle at 50% 40%, rgba(139,92,246,0.25), transparent 70%)'
          }} />

          {audioLoading ? (
            <svg className="w-6 h-6 text-indigo-300 animate-spin relative z-10" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={`relative z-10 transition-transform duration-300 ${isSpeaking ? 'scale-105' : ''}`}>
              {/* Mini wings */}
              <g className={isSpeaking ? 'animate-wing-left-speak' : 'animate-wing-left'}>
                <path d="M9 13c-2.5-1-4-0.3-4 1.5s1 2.5 2.5 2" stroke="rgba(165,143,255,0.45)" strokeWidth="0.8" fill="rgba(165,143,255,0.06)" strokeLinecap="round" />
              </g>
              <g className={isSpeaking ? 'animate-wing-right-speak' : 'animate-wing-right'}>
                <path d="M23 13c2.5-1 4-0.3 4 1.5s-1 2.5-2.5 2" stroke="rgba(165,143,255,0.45)" strokeWidth="0.8" fill="rgba(165,143,255,0.06)" strokeLinecap="round" />
              </g>

              {/* Head */}
              <circle cx="16" cy="9" r="3.5" fill="rgba(165,143,255,0.85)" />

              {/* Eyes */}
              <circle cx="14.8" cy="8.5" r="0.4" fill="rgba(255,255,255,0.85)" />
              <circle cx="17.2" cy="8.5" r="0.4" fill="rgba(255,255,255,0.85)" />

              {/* Body */}
              <path d="M16 13c-3 0-5.5 2-6 5h12c-.5-3-3-5-6-5z" fill="rgba(165,143,255,0.6)" />

              {/* Bow */}
              <path d="M21 7c1.5-1 3-.5 3 1s-1.5 2-3 1" stroke="rgba(255,180,200,0.9)" strokeWidth="1" fill="none" strokeLinecap="round" />
              <line x1="21" y1="8" x2="24.5" y2="5.5" stroke="rgba(255,180,200,0.8)" strokeWidth="0.7" strokeLinecap="round" />
              <path d="M24 5.5l0.8 0.4-0.4 0.8" stroke="rgba(255,180,200,0.9)" strokeWidth="0.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          {/* Sound waves */}
          {isSpeaking && (
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 flex items-end gap-[2px]">
              <div className="w-[2px] rounded-full bg-indigo-400 animate-sound-wave" style={{ animationDelay: '0s' }} />
              <div className="w-[2px] rounded-full bg-indigo-400 animate-sound-wave" style={{ animationDelay: '0.15s' }} />
              <div className="w-[2px] rounded-full bg-indigo-400 animate-sound-wave" style={{ animationDelay: '0.3s' }} />
            </div>
          )}

          {/* Available hint badge */}
          {!hintUsed && !audioLoading && !isSpeaking && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center animate-pulse">
              <span className="text-[9px] text-white font-bold">!</span>
            </div>
          )}

          {/* Mini constellation dots */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="eros-constellation-1 absolute w-0.5 h-0.5 rounded-full bg-indigo-400/50" style={{ animationDuration: '8s' }} />
            <div className="eros-constellation-2 absolute w-0.5 h-0.5 rounded-full bg-purple-400/40" style={{ animationDuration: '10s' }} />
          </div>
        </div>
      </button>
    </div>
  )
}

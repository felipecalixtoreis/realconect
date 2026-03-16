'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  /** ISO string of the user's last response timestamp */
  ultimaRespostaCriadoEm: string
  /** Callback when countdown reaches zero */
  onUnlocked?: () => void
}

/**
 * Calculates the next unlock time: 20:00 (8pm) of the day AFTER the last response.
 * If the user responded before 20:00, unlock is at 20:00 of the same day.
 * If the user responded after 20:00, unlock is at 20:00 of the next day.
 */
function calcularProximaLiberacao(ultimaResposta: string): Date {
  const dataResposta = new Date(ultimaResposta)

  // Create a date for 20:00 on the same day as the response (in local timezone)
  const liberacao = new Date(dataResposta)
  liberacao.setHours(20, 0, 0, 0)

  // If the response was at or after 20:00, next unlock is 20:00 the next day
  if (dataResposta.getHours() >= 20) {
    liberacao.setDate(liberacao.getDate() + 1)
  }

  return liberacao
}

function formatarTempo(ms: number): { horas: string; minutos: string; segundos: string } {
  if (ms <= 0) return { horas: '00', minutos: '00', segundos: '00' }

  const totalSegundos = Math.floor(ms / 1000)
  const horas = Math.floor(totalSegundos / 3600)
  const minutos = Math.floor((totalSegundos % 3600) / 60)
  const segundos = totalSegundos % 60

  return {
    horas: String(horas).padStart(2, '0'),
    minutos: String(minutos).padStart(2, '0'),
    segundos: String(segundos).padStart(2, '0'),
  }
}

export function CountdownTimer({ ultimaRespostaCriadoEm, onUnlocked }: CountdownTimerProps) {
  const [tempoRestante, setTempoRestante] = useState<number>(0)
  const [liberado, setLiberado] = useState(false)

  useEffect(() => {
    const proximaLiberacao = calcularProximaLiberacao(ultimaRespostaCriadoEm)

    const atualizar = () => {
      const agora = new Date()
      const diff = proximaLiberacao.getTime() - agora.getTime()

      if (diff <= 0) {
        setTempoRestante(0)
        setLiberado(true)
        onUnlocked?.()
        return false // stop interval
      }

      setTempoRestante(diff)
      return true // continue interval
    }

    // Initial check
    if (!atualizar()) return

    const interval = setInterval(() => {
      if (!atualizar()) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [ultimaRespostaCriadoEm, onUnlocked])

  if (liberado) return null

  const { horas, minutos, segundos } = formatarTempo(tempoRestante)

  return (
    <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/20 rounded-2xl p-5 sm:p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-indigo-300 text-sm font-semibold">Próxima etapa será liberada às 20h</h4>
          <p className="text-indigo-200/40 text-xs">O tempo é parte do experimento</p>
        </div>
      </div>

      {/* Countdown digits */}
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-900/80 border border-indigo-500/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[52px] sm:min-w-[64px] text-center">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider">
              {horas}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-indigo-400/50 mt-1.5 uppercase tracking-wider">horas</span>
        </div>

        <span className="text-xl sm:text-2xl text-indigo-400/40 font-bold animate-pulse mt-[-16px]">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-900/80 border border-indigo-500/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[52px] sm:min-w-[64px] text-center">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider">
              {minutos}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-indigo-400/50 mt-1.5 uppercase tracking-wider">min</span>
        </div>

        <span className="text-xl sm:text-2xl text-indigo-400/40 font-bold animate-pulse mt-[-16px]">:</span>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-900/80 border border-indigo-500/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[52px] sm:min-w-[64px] text-center">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-indigo-300 tracking-wider">
              {segundos}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-indigo-400/50 mt-1.5 uppercase tracking-wider">seg</span>
        </div>
      </div>

      {/* Subtle message */}
      <p className="text-center text-indigo-300/30 text-xs mt-4 italic">
        &ldquo;A paciência é a alquimia que transforma o tempo em profundidade.&rdquo; — Eros
      </p>
    </div>
  )
}

/**
 * Utility function to check if the next stage is time-locked.
 * Returns true if the user must wait until the next 20:00.
 */
export function isEtapaBloqueadaPorTempo(ultimaRespostaCriadoEm: string): boolean {
  const proximaLiberacao = calcularProximaLiberacao(ultimaRespostaCriadoEm)
  return new Date() < proximaLiberacao
}

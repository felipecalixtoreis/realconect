'use client'

import { useEffect, useState, useRef } from 'react'

interface OracleOfErosProps {
  compatibilidade: number
  intelectual: number
  emocional: number
  resumo: string
  padroesSemelhntes?: string[]
  diferencasCrescimento?: string[]
  subtitulo: string
}

export function OracleOfEros({
  compatibilidade,
  intelectual,
  emocional,
  resumo,
  padroesSemelhntes,
  diferencasCrescimento,
  subtitulo,
}: OracleOfErosProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState(0) // 0=hidden, 1=orb, 2=rings, 3=data, 4=text
  const [orbRotation, setOrbRotation] = useState(0)
  const animRef = useRef<number | null>(null)
  const rotRef = useRef<number | null>(null)

  useEffect(() => {
    setVisible(true)
    // Phase progression
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 1200)
    const t3 = setTimeout(() => setPhase(3), 2200)
    const t4 = setTimeout(() => setPhase(4), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  // Animate counter
  useEffect(() => {
    if (phase < 3) return
    let current = 0
    const duration = 1500
    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Easing
      const eased = 1 - Math.pow(1 - progress, 3)
      current = Math.round(eased * compatibilidade)
      setDisplayValue(current)
      if (progress < 1) {
        animRef.current = requestAnimationFrame(step)
      }
    }
    animRef.current = requestAnimationFrame(step)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [phase, compatibilidade])

  // Continuous orb rotation
  useEffect(() => {
    let angle = 0
    const rotate = () => {
      angle += 0.3
      setOrbRotation(angle)
      rotRef.current = requestAnimationFrame(rotate)
    }
    rotRef.current = requestAnimationFrame(rotate)
    return () => { if (rotRef.current) cancelAnimationFrame(rotRef.current) }
  }, [])

  const getEnergyColor = () => {
    if (compatibilidade < 30) return { primary: '#6366F1', secondary: '#818CF8', glow: 'rgba(99,102,241,0.4)' }
    if (compatibilidade < 50) return { primary: '#8B5CF6', secondary: '#A78BFA', glow: 'rgba(139,92,246,0.4)' }
    if (compatibilidade < 75) return { primary: '#A855F7', secondary: '#C084FC', glow: 'rgba(168,85,247,0.4)' }
    return { primary: '#D946EF', secondary: '#E879F9', glow: 'rgba(217,70,239,0.4)' }
  }

  const colors = getEnergyColor()
  const circumference = 2 * Math.PI * 90
  const strokeDashoffset = circumference - (displayValue / 100) * circumference
  const circumference2 = 2 * Math.PI * 80
  const strokeDashoffset2 = circumference2 - (displayValue / 100) * circumference2

  return (
    <div className={`relative transition-all duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Background cosmic glow */}
      <div className="absolute inset-0 -m-8 overflow-hidden rounded-3xl pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${colors.glow}, transparent 70%)` }} />
        <div className="oracle-nebula-1 absolute top-0 right-0 w-[200px] h-[200px] rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, rgba(139,92,246,0.6), transparent 70%)` }} />
        <div className="oracle-nebula-2 absolute bottom-0 left-0 w-[150px] h-[150px] rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, rgba(99,102,241,0.6), transparent 70%)` }} />
      </div>

      <div className="relative bg-gradient-to-br from-slate-950/90 via-indigo-950/40 to-slate-950/90 border border-indigo-500/20 rounded-3xl p-6 sm:p-10 backdrop-blur-sm overflow-hidden">
        {/* Scan lines effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }} />

        {/* Title */}
        <div className={`text-center mb-8 transition-all duration-700 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-indigo-500/50" />
            <p className="text-indigo-400/80 text-[10px] font-bold uppercase tracking-[0.3em]">
              Leitura Cósmica
            </p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-indigo-500/50" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-violet-300 tracking-wide">
            Oráculo de Eros
          </h2>
          <p className="text-indigo-400/50 text-xs mt-1 tracking-widest uppercase">{subtitulo}</p>
        </div>

        {/* Central Orb Visualization */}
        <div className={`flex justify-center mb-10 transition-all duration-1000 ${phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className="relative w-[240px] h-[240px] sm:w-[280px] sm:h-[280px]">
            {/* Outer rotating ring */}
            <div className="absolute inset-0" style={{ transform: `rotate(${orbRotation}deg)` }}>
              <svg viewBox="0 0 280 280" className="w-full h-full">
                {/* Orbit path */}
                <circle cx="140" cy="140" r="130" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="1" strokeDasharray="4 8" />
                {/* Orbiting dots */}
                <circle cx="140" cy="10" r="2.5" fill={colors.primary} opacity="0.7">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="270" cy="140" r="1.5" fill={colors.secondary} opacity="0.5">
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="40" cy="220" r="2" fill="rgba(168,85,247,0.6)" opacity="0.6">
                  <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.5s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            {/* Secondary counter-rotating ring */}
            <div className="absolute inset-4" style={{ transform: `rotate(${-orbRotation * 0.7}deg)` }}>
              <svg viewBox="0 0 240 240" className="w-full h-full">
                <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(139,92,246,0.06)" strokeWidth="1" strokeDasharray="2 12" />
                <circle cx="120" cy="10" r="1.5" fill={colors.secondary} opacity="0.4" />
                <circle cx="230" cy="120" r="1" fill={colors.primary} opacity="0.3" />
              </svg>
            </div>

            {/* Energy rings (appear in phase 2) */}
            <div className={`absolute inset-0 transition-all duration-1000 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
              <svg viewBox="0 0 240 240" className="w-full h-full transform -rotate-90">
                {/* Background track */}
                <circle cx="120" cy="120" r="90" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="4" />
                {/* Intellectual arc */}
                <circle cx="120" cy="120" r="90" fill="none"
                  stroke={colors.primary} strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${colors.glow})` }} />
                {/* Background track 2 */}
                <circle cx="120" cy="120" r="80" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="3" />
                {/* Emotional arc */}
                <circle cx="120" cy="120" r="80" fill="none"
                  stroke={colors.secondary} strokeWidth="3"
                  strokeDasharray={circumference2}
                  strokeDashoffset={strokeDashoffset2}
                  strokeLinecap="round"
                  opacity="0.6"
                  style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1) 0.3s', filter: `drop-shadow(0 0 4px ${colors.glow})` }} />
              </svg>
            </div>

            {/* Central core */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`relative transition-all duration-700 ${phase >= 2 ? 'scale-100' : 'scale-75'}`}>
                {/* Core glow */}
                <div className="absolute inset-0 -m-8 rounded-full animate-pulse"
                  style={{ background: `radial-gradient(circle, ${colors.glow}, transparent 70%)` }} />

                {/* Core circle */}
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-indigo-500/30 flex flex-col items-center justify-center"
                  style={{ background: 'radial-gradient(circle at 50% 40%, rgba(30,27,75,0.95), rgba(15,23,42,0.98))' }}>

                  {/* Inner glow ring */}
                  <div className="absolute inset-0 rounded-full oracle-inner-glow" />

                  {/* Percentage */}
                  <div className={`transition-all duration-500 ${phase >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                    <span className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-200 to-purple-300 tabular-nums">
                      {displayValue}
                    </span>
                    <span className="text-lg text-indigo-300/70 ml-0.5">%</span>
                  </div>

                  {/* Label */}
                  <p className={`text-[9px] text-indigo-400/60 uppercase tracking-[0.2em] mt-1 transition-all duration-500 delay-200 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                    Conexão
                  </p>
                </div>
              </div>
            </div>

            {/* Corner markers */}
            <div className={`absolute top-0 left-0 w-6 h-6 border-t border-l border-indigo-500/20 rounded-tl-lg transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute top-0 right-0 w-6 h-6 border-t border-r border-indigo-500/20 rounded-tr-lg transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute bottom-0 left-0 w-6 h-6 border-b border-l border-indigo-500/20 rounded-bl-lg transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute bottom-0 right-0 w-6 h-6 border-b border-r border-indigo-500/20 rounded-br-lg transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        </div>

        {/* Data readouts */}
        <div className={`grid grid-cols-2 gap-4 mb-8 transition-all duration-700 ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          {/* Intellectual */}
          <div className="bg-indigo-950/40 border border-indigo-500/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary, boxShadow: `0 0 6px ${colors.glow}` }} />
              <span className="text-[10px] text-indigo-400/70 uppercase tracking-wider font-semibold">Intelectual</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-indigo-200">{intelectual}</span>
              <span className="text-xs text-indigo-400/50 mb-1">/ 100</span>
            </div>
            <div className="mt-2 h-1.5 bg-indigo-950/60 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1500 delay-300"
                style={{
                  width: phase >= 3 ? `${intelectual}%` : '0%',
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                  boxShadow: `0 0 8px ${colors.glow}`,
                  transition: 'width 1.5s cubic-bezier(0.4,0,0.2,1) 0.3s',
                }}
              />
            </div>
          </div>

          {/* Emotional */}
          <div className="bg-purple-950/30 border border-purple-500/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.secondary, boxShadow: `0 0 6px ${colors.glow}` }} />
              <span className="text-[10px] text-purple-400/70 uppercase tracking-wider font-semibold">Emocional</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-purple-200">{emocional}</span>
              <span className="text-xs text-purple-400/50 mb-1">/ 100</span>
            </div>
            <div className="mt-2 h-1.5 bg-purple-950/60 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1500 delay-500"
                style={{
                  width: phase >= 3 ? `${emocional}%` : '0%',
                  background: `linear-gradient(90deg, ${colors.secondary}, #E879F9)`,
                  boxShadow: `0 0 8px rgba(168,85,247,0.3)`,
                  transition: 'width 1.5s cubic-bezier(0.4,0,0.2,1) 0.5s',
                }}
              />
            </div>
          </div>
        </div>

        {/* Patterns & Differences */}
        {(padroesSemelhntes?.length || diferencasCrescimento?.length) && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 transition-all duration-700 delay-200 ${phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            {padroesSemelhntes && padroesSemelhntes.length > 0 && (
              <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-indigo-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  <span className="text-[10px] text-indigo-400/60 uppercase tracking-wider font-semibold">Padrões em Comum</span>
                </div>
                <ul className="space-y-1.5">
                  {padroesSemelhntes.map((p, i) => (
                    <li key={i} className="text-sm text-indigo-200/70 flex items-start gap-2">
                      <span className="text-indigo-500/40 mt-1.5 w-1 h-1 rounded-full bg-indigo-500/40 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {diferencasCrescimento && diferencasCrescimento.length > 0 && (
              <div className="bg-violet-950/20 border border-violet-500/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-violet-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                  </svg>
                  <span className="text-[10px] text-violet-400/60 uppercase tracking-wider font-semibold">Pontos de Crescimento</span>
                </div>
                <ul className="space-y-1.5">
                  {diferencasCrescimento.map((d, i) => (
                    <li key={i} className="text-sm text-violet-200/70 flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-violet-500/40 flex-shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Oracle reading / resumo */}
        {resumo && (
          <div className={`relative transition-all duration-700 delay-500 ${phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <div className="bg-gradient-to-br from-indigo-950/30 to-purple-950/20 border border-indigo-500/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-indigo-400/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
                <span className="text-[10px] text-indigo-400/50 uppercase tracking-[0.2em] font-semibold">Leitura do Oráculo</span>
              </div>
              <p className="text-indigo-200/80 text-sm leading-relaxed italic">
                &ldquo;{resumo}&rdquo;
              </p>
            </div>

            {/* Decorative bottom line */}
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-px bg-gradient-to-r from-transparent to-indigo-500/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30" />
                <div className="w-8 h-px bg-gradient-to-l from-transparent to-indigo-500/30" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

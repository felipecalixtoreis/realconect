'use client'

import { useEffect, useState, useRef } from 'react'

interface HeartGaugeProps {
  valor: number
  titulo: string
  tendencia?: 'crescente' | 'decrescente' | 'estavel'
}

export function HeartGauge({ valor, titulo, tendencia = 'estavel' }: HeartGaugeProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [visible, setVisible] = useState(false)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    setVisible(true)
    let current = 0
    const step = () => {
      current += 1
      if (current <= valor) {
        setDisplayValue(current)
        animationRef.current = requestAnimationFrame(step)
      }
    }
    animationRef.current = requestAnimationFrame(step)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [valor])

  const getColor = () => {
    if (displayValue < 30) return '#3B82F6'
    if (displayValue < 50) return '#8B5CF6'
    if (displayValue < 75) return '#EC4899'
    return '#EF4444'
  }

  const circumference = 2 * Math.PI * 80
  const strokeDashoffset = circumference - (displayValue / 100) * circumference

  const getTendenciaIcon = () => {
    if (tendencia === 'crescente') return '↗'
    if (tendencia === 'decrescente') return '↘'
    return '→'
  }

  const getTendenciaLabel = () => {
    if (tendencia === 'crescente') return 'Crescente'
    if (tendencia === 'decrescente') return 'Decrescente'
    return 'Estável'
  }

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl transition-all duration-700 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.8]'
      }`}
    >
      <h3 className="text-lg font-semibold text-white/90 mb-6 uppercase tracking-wider text-center">
        {titulo}
      </h3>

      <div className="relative w-[200px] h-[200px]">
        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
          <circle cx="100" cy="100" r="80" fill="none" stroke="#334155" strokeWidth="12" />
          <circle
            cx="100" cy="100" r="80" fill="none"
            stroke={getColor()}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.05s linear, stroke 0.3s ease',
              filter: `drop-shadow(0 0 8px ${getColor()}40)`
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl animate-heart-pulse">❤️</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-4xl font-bold text-white tabular-nums">{displayValue}%</p>
        <p className="text-sm text-gray-400 mt-2 flex items-center gap-1 justify-center">
          <span>{getTendenciaIcon()}</span>
          <span>{getTendenciaLabel()}</span>
        </p>
      </div>
    </div>
  )
}

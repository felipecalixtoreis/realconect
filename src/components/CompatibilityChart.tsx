'use client'

import { useEffect, useState } from 'react'

interface Dimension {
  label: string
  value: number
}

interface CompatibilityChartProps {
  titulo: string
  dimensions: Dimension[]
  compatibilidadeGeral: number
  resumo?: string
}

export function CompatibilityChart({
  titulo,
  dimensions,
  compatibilidadeGeral,
  resumo
}: CompatibilityChartProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  return (
    <div
      className={`p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
    >
      <h3 className="text-lg font-semibold text-white/90 mb-6 uppercase tracking-wider">
        {titulo}
      </h3>

      <div className="space-y-4">
        {dimensions.map((dim, index) => (
          <div
            key={dim.label}
            className="flex items-center gap-4 transition-all duration-500"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(-20px)',
              transitionDelay: `${index * 150}ms`
            }}
          >
            <span className="text-gray-300 text-sm w-32 text-right">{dim.label}</span>
            <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: visible ? `${dim.value}%` : '0%',
                  background: 'linear-gradient(90deg, #7C3AED, #EC4899)',
                  transitionDelay: `${index * 150}ms`
                }}
              />
            </div>
            <span className="text-white font-semibold text-sm w-12">{dim.value}%</span>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Compatibilidade Geral</span>
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {compatibilidadeGeral}%
          </span>
        </div>
        {resumo && (
          <p className="mt-4 text-gray-400 text-sm italic leading-relaxed">
            &ldquo;{resumo}&rdquo;
          </p>
        )}
      </div>
    </div>
  )
}

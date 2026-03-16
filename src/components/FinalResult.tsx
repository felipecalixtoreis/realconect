'use client'

import { useEffect, useState } from 'react'
import { HeartGauge } from './HeartGauge'
import { CompatibilityChart } from './CompatibilityChart'

interface FinalResultProps {
  indiceGeral: number
  resumoFinal: string
  mensagemEspecial: string
  indices: Array<{
    tipo_indice: string
    compatibilidade: number
    resumo: string
  }>
}

export function FinalResult({ indiceGeral, resumoFinal, mensagemEspecial, indices }: FinalResultProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  const dimensionLabels: Record<string, string> = {
    curiosidade: 'Curiosidade',
    intelectual: 'Intelectual',
    afinidades: 'Afinidades',
    experiencia: 'Experiência',
    emocional: 'Emocional',
    conexao: 'Conexão',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Hero */}
      <div
        className={`text-center py-12 transition-all duration-1000 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <p
          className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-4 transition-all duration-700 delay-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          Resultado do Experimento
        </p>
        <h1
          className="text-4xl sm:text-5xl font-bold text-white mb-4 transition-all duration-700 delay-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          A vida é curta. Está pronta?
        </h1>
        <p
          className="text-xl text-gray-300 transition-all duration-700 delay-1000"
          style={{ opacity: visible ? 1 : 0 }}
        >
          Confirmada ✓
        </p>
      </div>

      {/* Main gauge */}
      <HeartGauge
        valor={indiceGeral}
        titulo="Índice de Conexão Real"
        tendencia="crescente"
      />

      {/* Compatibility breakdown */}
      <CompatibilityChart
        titulo="Dimensões da Conexão"
        dimensions={indices.map(i => ({
          label: dimensionLabels[i.tipo_indice] || i.tipo_indice,
          value: i.compatibilidade,
        }))}
        compatibilidadeGeral={indiceGeral}
      />

      {/* Summary */}
      <div
        className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 shadow-2xl transition-all duration-700 delay-500 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        <h3 className="text-lg font-semibold text-purple-400 mb-4">Resumo da Jornada</h3>
        <p className="text-gray-300 leading-relaxed whitespace-pre-line">{resumoFinal}</p>
      </div>

      {/* Special message */}
      <div
        className={`text-center py-8 transition-all duration-700 delay-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        <div className="inline-block bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8">
          <span className="text-4xl mb-4 block">💜</span>
          <p className="text-white text-lg italic">&ldquo;{mensagemEspecial}&rdquo;</p>
        </div>
      </div>
    </div>
  )
}

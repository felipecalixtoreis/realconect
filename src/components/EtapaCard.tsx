'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getNarrativaPersonalizada } from '@/lib/etapas'

interface EtapaCardProps {
  numero: number
  titulo: string
  narrativa: string
  imagem: string
  pergunta: string
  tipoResposta: 'texto' | 'multipla_escolha'
  maxCaracteres: number
  opcoes?: string[]
  onResponder: (resposta: string, opcoesSelecionadas?: string[]) => void
  loading?: boolean
  nomeUsuario?: string
}

export function EtapaCard({
  numero,
  titulo,
  narrativa,
  imagem,
  pergunta,
  tipoResposta,
  maxCaracteres,
  opcoes,
  onResponder,
  loading = false,
  nomeUsuario
}: EtapaCardProps) {
  const [resposta, setResposta] = useState('')
  const [selecionadas, setSelecionadas] = useState<string[]>([])
  const [visible, setVisible] = useState(false)
  const [showQuestion, setShowQuestion] = useState(false)

  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => setShowQuestion(true), 800)
    return () => clearTimeout(t)
  }, [])

  const toggleOpcao = (opcao: string) => {
    setSelecionadas(prev =>
      prev.includes(opcao)
        ? prev.filter(o => o !== opcao)
        : [...prev, opcao]
    )
  }

  const handleSubmit = () => {
    if (tipoResposta === 'multipla_escolha') {
      const textoFinal = resposta || selecionadas.join(', ')
      onResponder(textoFinal, selecionadas)
    } else {
      onResponder(resposta)
    }
  }

  const isValid = tipoResposta === 'multipla_escolha'
    ? selecionadas.length > 0 || resposta.trim().length > 0
    : resposta.trim().length > 0

  return (
    <div
      className={`max-w-2xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-800 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Image */}
      <div className="relative h-64 w-full overflow-hidden">
        <Image
          src={imagem}
          alt={titulo}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 672px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900" />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-purple-500/80 backdrop-blur-sm rounded-full text-xs font-bold text-white uppercase tracking-wider">
            Etapa {numero}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{titulo}</h2>

        {/* Narrative */}
        <div className={`transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-gray-300 text-lg leading-relaxed mb-8 italic whitespace-pre-line">
            {nomeUsuario ? getNarrativaPersonalizada(narrativa, nomeUsuario) : narrativa}
          </p>
        </div>

        {/* Question */}
        <div
          className={`bg-slate-700/50 rounded-xl p-6 mb-6 border border-slate-600/50 transition-opacity duration-700 ${
            showQuestion ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-white font-semibold mb-4 text-lg">{pergunta}</p>

          {/* Multiple choice options */}
          {tipoResposta === 'multipla_escolha' && opcoes && (
            <div className="flex flex-wrap gap-2 mb-4">
              {opcoes.map((opcao) => (
                <button
                  key={opcao}
                  onClick={() => toggleOpcao(opcao)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selecionadas.includes(opcao)
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
                  }`}
                >
                  {opcao}
                </button>
              ))}
            </div>
          )}

          {/* Text input */}
          <div className="relative">
            <textarea
              value={resposta}
              onChange={(e) => setResposta(e.target.value.slice(0, maxCaracteres))}
              placeholder={tipoResposta === 'multipla_escolha'
                ? "Ou escreva sua própria resposta..."
                : "Sua resposta sincera aqui..."
              }
              className="w-full bg-slate-600/50 text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none placeholder:text-gray-500 border border-slate-500/30"
              rows={4}
            />
            <span className="absolute bottom-3 right-3 text-xs text-gray-500">
              {resposta.length}/{maxCaracteres}
            </span>
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analisando...
            </span>
          ) : (
            'Continuar →'
          )}
        </button>
      </div>
    </div>
  )
}

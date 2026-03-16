'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Fragmentos da lenda — cada um desbloqueado por uma etapa
const FRAGMENTOS = [
  {
    texto: "Existe uma lenda antiga entre aqueles que estudam encontros humanos:",
    etapaMinima: 0, // sempre visível
  },
  {
    texto: "que o universo, às vezes, cria pequenas coincidências cuidadosamente alinhadas —",
    etapaMinima: 1,
  },
  {
    texto: "como se astros distantes conspirassem silenciosamente.",
    etapaMinima: 2,
  },
  {
    texto: "Quando duas mentes raramente curiosas se encontram sob certas circunstâncias,",
    etapaMinima: 3,
  },
  {
    texto: "uma sequência inesperada pode ser desencadeada.",
    etapaMinima: 4,
  },
  {
    texto: "E, em meio a esse processo, algo raro pode emergir:",
    etapaMinima: 5,
  },
  {
    texto: "uma conexão que não poderia ter sido prevista.",
    etapaMinima: 6,
  },
]

export default function Home() {
  const [fase, setFase] = useState(0)
  const [etapaAtual, setEtapaAtual] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check auth and load progress
  useEffect(() => {
    const checkProgress = async () => {
      try {
        // First: load public progress (works for everyone, even not logged in)
        const pubRes = await fetch('/api/progresso-publico')
        const pubData = await pubRes.json()
        if (pubData.etapa_desbloqueada) {
          setEtapaAtual(pubData.etapa_desbloqueada)
        }

        // Then: check if logged in for personalized progress
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setIsLoggedIn(true)
          const res = await fetch('/api/session')
          const data = await res.json()
          if (data.session) {
            const minhasRespostas = (data.respostas || []).filter(
              (r: any) => r.user_id === user.id
            )
            const personalProgress = minhasRespostas.length
            setEtapaAtual(prev => Math.max(prev, personalProgress))
          }
        }
      } catch {
        // Not logged in, that's fine
      }
      setLoading(false)
    }
    checkProgress()
  }, [])

  // Entrance animation timers
  useEffect(() => {
    const timer1 = setTimeout(() => setFase(1), 800)
    const timer2 = setTimeout(() => setFase(2), 2500)
    const timer3 = setTimeout(() => setFase(3), 4500)
    const timer4 = setTimeout(() => setFase(4), 6000)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl text-center">
        {/* Two silhouettes with icons + pulsing heart */}
        <div
          className={`mb-12 flex items-center justify-center gap-4 sm:gap-6 transition-opacity duration-[2000ms] ${
            fase >= 0 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Person 1 */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/50 to-purple-800/30 backdrop-blur-sm border border-purple-400/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(192,170,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.2 6H8.2C6.3 13.7 5 11.5 5 9a7 7 0 0 1 7-7z"/>
                <path d="M9 22h6"/><path d="M10 18h4"/>
                <path d="M12 2v4"/><path d="M8 6l2 2"/><path d="M16 6l-2 2"/>
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px]">🧠</div>
          </div>

          {/* Pulsing heart connection */}
          <div className="flex items-center gap-0 relative">
            <div className="h-0.5 w-8 sm:w-12 bg-gradient-to-r from-purple-500/60 to-pink-400/60" />
            <div className="relative mx-1">
              <span className="text-3xl sm:text-4xl animate-heart-pulse inline-block">❤️</span>
              <div className="absolute inset-0 animate-ping-slow">
                <span className="text-3xl sm:text-4xl opacity-20 inline-block">❤️</span>
              </div>
            </div>
            <div className="h-0.5 w-8 sm:w-12 bg-gradient-to-r from-pink-400/60 to-pink-500/60" />
          </div>

          {/* Person 2 */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-600/50 to-pink-800/30 backdrop-blur-sm border border-pink-400/30 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,180,200,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.2 6H8.2C6.3 13.7 5 11.5 5 9a7 7 0 0 1 7-7z"/>
                <path d="M9 22h6"/><path d="M10 18h4"/>
                <path d="M12 2v4"/><path d="M8 6l2 2"/><path d="M16 6l-2 2"/>
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-[10px]">✨</div>
          </div>
        </div>

        {/* === THE LEGEND — progressively revealed === */}
        <div
          className={`mb-8 transition-all duration-[1500ms] ${
            fase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <div className="text-xl sm:text-2xl leading-relaxed space-y-1">
            {FRAGMENTOS.map((frag, i) => {
              const isUnlocked = etapaAtual >= frag.etapaMinima
              const isFirst = frag.etapaMinima === 0

              return (
                <span
                  key={i}
                  className={`inline transition-all duration-700 ${
                    isUnlocked
                      ? isFirst
                        ? 'text-gray-300'
                        : 'text-white font-light'
                      : 'text-transparent select-none'
                  }`}
                  style={
                    !isUnlocked
                      ? {
                          background: 'linear-gradient(90deg, rgba(124,58,237,0.15), rgba(236,72,153,0.15))',
                          borderRadius: '4px',
                          filter: 'blur(6px)',
                          WebkitUserSelect: 'none',
                          padding: '0 2px',
                        }
                      : undefined
                  }
                >
                  {isUnlocked ? frag.texto : frag.texto.replace(/[a-záàâãéèêíïóôõöúçñ]/gi, '█')}{' '}
                </span>
              )
            })}
          </div>
        </div>

        {/* Explanation about progressive reveal */}
        <div
          className={`mb-10 transition-all duration-[1500ms] ${
            fase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <div className="inline-block bg-slate-800/50 border border-slate-700/50 rounded-xl px-5 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400 flex-shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className="text-left">
                Este parágrafo possui informações que só podem ser reveladas à medida que o processo do experimento vai sendo desbloqueado pelos participantes.
              </span>
            </div>
            {isLoggedIn && etapaAtual > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div
                    key={n}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      n <= etapaAtual ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-700'
                    }`}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-2">{etapaAtual}/6</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <div
          className={`transition-all duration-800 ${
            fase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <button
            onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
            className="group relative px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
          >
            <span className="relative z-10">
              {isLoggedIn ? 'Continuar o Experimento' : 'Participar do Experimento'}
            </span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
          </button>
        </div>

        {/* Progress indicator for returning users */}
        {!loading && isLoggedIn && etapaAtual > 0 && etapaAtual < 6 && (
          <p
            className={`mt-6 text-gray-500 text-sm transition-all duration-700 ${
              fase >= 4 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Você está na etapa {etapaAtual + 1} de 6
          </p>
        )}

        {!loading && isLoggedIn && etapaAtual >= 6 && (
          <p
            className={`mt-6 text-purple-400 text-sm font-medium transition-all duration-700 ${
              fase >= 4 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            ✓ Experimento completo — a lenda foi revelada
          </p>
        )}
      </div>
    </main>
  )
}

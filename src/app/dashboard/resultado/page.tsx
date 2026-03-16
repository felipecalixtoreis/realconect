'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FinalResult } from '@/components/FinalResult'
import { LoadingScreen } from '@/components/LoadingScreen'

export default function ResultadoPage() {
  const [loading, setLoading] = useState(true)
  const [resultado, setResultado] = useState<any>(null)
  const [indices, setIndices] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await fetch('/api/session')
      const data = await res.json()

      if (!data.session) { router.push('/dashboard'); return }

      setIndices(data.indices || [])

      // Generate final result if not already done
      if (data.indices?.length >= 1) {
        try {
          const finalRes = await fetch('/api/analyze/final', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: data.session.id }),
          })
          const finalData = await finalRes.json()
          setResultado(finalData)
        } catch (error) {
          console.error('Error generating final result:', error)
        }
      }

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <LoadingScreen message="Gerando resultado final..." />

  if (!resultado) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">
          Resultado ainda não disponível
        </h2>
        <p className="text-gray-400">
          Complete todas as etapas para ver o resultado final.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-8 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
        >
          ← Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="py-8">
      <FinalResult
        indiceGeral={resultado.indice_geral}
        resumoFinal={resultado.resumo_final}
        mensagemEspecial={resultado.mensagem_especial}
        indices={indices}
      />

      <div className="text-center mt-12">
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
        >
          ← Voltar ao Dashboard
        </button>
      </div>
    </div>
  )
}

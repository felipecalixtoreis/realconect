import { SupabaseClient } from '@supabase/supabase-js'
import { HistoricoAcumulado } from './openai'

/**
 * Busca o histórico acumulado de um usuário ao longo de todas as etapas.
 * Inclui: respostas de cada etapa + perguntas/respostas dos 3 desejos (genie_interactions).
 * Isso permite que Eros tenha um perfil progressivamente mais rico a cada etapa.
 */
export async function buscarHistoricoAcumulado(
  admin: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<HistoricoAcumulado> {
  const [respostasResult, desejosResult] = await Promise.all([
    admin
      .from('respostas')
      .select('etapa, resposta')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('etapa', { ascending: true }),
    admin
      .from('genie_interactions')
      .select('etapa, pergunta, resposta')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('etapa', { ascending: true })
      .order('interaction_number', { ascending: true }),
  ])

  return {
    respostas: (respostasResult.data || []).map(r => ({
      etapa: r.etapa,
      resposta: r.resposta,
    })),
    desejos: (desejosResult.data || []).map(d => ({
      etapa: d.etapa,
      pergunta: d.pergunta,
      resposta: d.resposta,
    })),
  }
}

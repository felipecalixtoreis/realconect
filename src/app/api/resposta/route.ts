import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { session_id, etapa, resposta, opcoes_selecionadas, skip_daily_limit } = await request.json()

    if (!session_id || !etapa || !resposta) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Check daily limit (1 response per day) unless admin override
    if (!skip_daily_limit) {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

      const { data: todayResponses } = await admin
        .from('respostas')
        .select('id, etapa')
        .eq('session_id', session_id)
        .eq('user_id', user.id)
        .gte('criado_em', startOfDay)
        .lt('criado_em', endOfDay)

      if (todayResponses && todayResponses.length > 0) {
        return NextResponse.json({
          error: 'Você já respondeu uma pergunta hoje. Volte amanhã para a próxima etapa.',
          daily_limit: true,
          responded_etapa: todayResponses[0].etapa,
        }, { status: 429 })
      }
    }

    // Save response
    const { data, error } = await supabase
      .from('respostas')
      .upsert(
        {
          session_id,
          user_id: user.id,
          etapa,
          resposta,
          opcoes_selecionadas: opcoes_selecionadas || null,
        },
        { onConflict: 'session_id,user_id,etapa' }
      )
      .select()
      .single()

    if (error) {
      console.error('Error saving response:', error)
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
    }

    // Check if both users have responded to this stage
    const { data: otherResponse } = await supabase
      .from('respostas')
      .select('*')
      .eq('session_id', session_id)
      .eq('etapa', etapa)
      .neq('user_id', user.id)
      .single()

    // Only share the other's response if they authorized it
    const respostaOutroAutorizada = otherResponse?.autorizar_exibicao
      ? otherResponse.resposta
      : null

    // Auto-advance etapa_atual so the next stage becomes visible
    // (the countdown timer still controls WHEN the user can access it)
    const { data: sessionData } = await admin
      .from('experiment_session')
      .select('etapa_atual')
      .eq('id', session_id)
      .single()

    if (sessionData && etapa >= sessionData.etapa_atual && etapa < 6) {
      await admin
        .from('experiment_session')
        .update({ etapa_atual: etapa + 1 })
        .eq('id', session_id)
    }

    return NextResponse.json({
      resposta: data,
      ambos_responderam: !!otherResponse,
      resposta_outro: respostaOutroAutorizada,
    })
  } catch (error) {
    console.error('Response error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

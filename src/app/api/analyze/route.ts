import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analisarCompatibilidade, sugerirAtividade } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { session_id, etapa, resposta_user1, resposta_user2, tipo_indice } = body

    if (!session_id || !etapa || !resposta_user1 || !resposta_user2 || !tipo_indice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch admin context for enriched analysis (session-wide + user-specific profiles)
    const adminClient = createAdminClient()
    const { data: contextos } = await adminClient
      .from('admin_context')
      .select('contexto')
      .or(`session_id.eq.${session_id},user_id.eq.${body.user1_id},user_id.eq.${body.user2_id}`)

    const contextoAdmin = contextos?.map(c => c.contexto).join('\n') || undefined

    // Analyze compatibility
    const analise = await analisarCompatibilidade(
      resposta_user1,
      resposta_user2,
      etapa,
      tipo_indice,
      contextoAdmin
    )

    // Save index to database using admin client (bypasses RLS)
    const { data: indice, error: indiceError } = await adminClient
      .from('indices')
      .insert({
        session_id,
        etapa,
        tipo_indice,
        valor_user1: analise.compatibilidade_intelectual,
        valor_user2: analise.compatibilidade_emocional,
        compatibilidade: Math.round(
          (analise.compatibilidade_intelectual + analise.compatibilidade_emocional) / 2
        ),
        padroes_semelhantes: analise.padroes_semelhantes,
        diferencas_crescimento: analise.diferencas_crescimento,
        resumo: analise.resumo,
      })
      .select()
      .single()

    if (indiceError) {
      console.error('Error saving index:', indiceError)
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
    }

    // Add timeline event
    await adminClient.from('timeline').insert({
      session_id,
      titulo: `Constelação ${etapa} — Padrão Revelado`,
      descricao: analise.resumo,
      tipo: 'descoberta',
    })

    // If stage 3, also generate activity suggestion
    let sugestao = null
    if (etapa === 3) {
      try {
        const { data: allRespostas } = await adminClient
          .from('respostas')
          .select('*')
          .eq('session_id', session_id)
          .order('etapa')

        const user1Respostas = allRespostas?.filter(r => r.user_id === body.user1_id).map(r => r.resposta) || []
        const user2Respostas = allRespostas?.filter(r => r.user_id === body.user2_id).map(r => r.resposta) || []

        sugestao = await sugerirAtividade(
          user1Respostas,
          user2Respostas,
          body.opcoes_selecionadas
        )
      } catch (e) {
        console.error('Error generating suggestion:', e)
      }
    }

    return NextResponse.json({
      analise,
      indice,
      sugestao,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

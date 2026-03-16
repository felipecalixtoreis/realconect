import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - Fetch all responses for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    const admin = createAdminClient()

    let query = admin.from('respostas').select('*').order('etapa', { ascending: true })
    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ respostas: data || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a response by ID
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    const admin = createAdminClient()

    // Get response info before deleting
    const { data: resposta } = await admin.from('respostas').select('session_id, etapa').eq('id', id).single()

    const { error } = await admin.from('respostas').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Delete related data for that stage too
    if (resposta) {
      await Promise.all([
        // Indices de compatibilidade
        admin.from('indices').delete()
          .eq('session_id', resposta.session_id)
          .eq('etapa', resposta.etapa),
        // Interações com Eros (3 desejos)
        admin.from('genie_interactions').delete()
          .eq('session_id', resposta.session_id)
          .eq('etapa', resposta.etapa),
        // Dicas do Eros (hint flutuante)
        admin.from('eros_hints').delete()
          .eq('session_id', resposta.session_id)
          .eq('etapa', resposta.etapa),
        // Eventos da linha do tempo (exceto o primeiro evento de criação da sessão)
        admin.from('timeline').delete()
          .eq('session_id', resposta.session_id)
          .eq('tipo', 'descoberta'),
      ])
    }

    return NextResponse.json({ message: 'Resposta, índices, interações e dicas da etapa excluídos com sucesso!' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Submit a response as admin (impersonating a user)
export async function POST(request: NextRequest) {
  try {
    const { session_id, user_id, etapa, resposta, opcoes_selecionadas } = await request.json()

    const admin = createAdminClient()

    const { data, error } = await admin.from('respostas').upsert(
      {
        session_id,
        user_id,
        etapa,
        resposta,
        opcoes_selecionadas: opcoes_selecionadas || null,
      },
      { onConflict: 'session_id,user_id,etapa' }
    ).select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: 'Resposta enviada com sucesso!', data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user1_email, user2_email, etapa_atual } = await request.json()
    const admin = createAdminClient()

    // Find users by email
    const { data: user1 } = await admin
      .from('profiles')
      .select('id')
      .eq('email', user1_email)
      .single()

    const { data: user2 } = await admin
      .from('profiles')
      .select('id')
      .eq('email', user2_email)
      .single()

    if (!user1 || !user2) {
      return NextResponse.json({
        error: `Usuário(s) não encontrado(s). ${!user1 ? user1_email : ''} ${!user2 ? user2_email : ''}`.trim()
      }, { status: 404 })
    }

    const { data: session, error } = await admin
      .from('experiment_session')
      .insert({
        user1_id: user1.id,
        user2_id: user2.id,
        etapa_atual: etapa_atual || 1,
        status: 'ativo',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create initial timeline event
    await admin.from('timeline').insert({
      session_id: session.id,
      titulo: 'O Primeiro Sinal',
      descricao: 'Dois pontos no cosmos se alinharam. O que parecia acaso revelou-se inevitável.',
      tipo: 'descoberta',
    })

    return NextResponse.json({ message: 'Sessão criada com sucesso!', session })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { session_id, etapa_atual, status } = await request.json()
    const admin = createAdminClient()

    const updateData: Record<string, any> = {}
    if (etapa_atual !== undefined) updateData.etapa_atual = etapa_atual
    if (status !== undefined) updateData.status = status

    const { error } = await admin
      .from('experiment_session')
      .update(updateData)
      .eq('id', session_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (status === 'encerrado') {
      return NextResponse.json({ message: 'Experimento encerrado com sucesso' })
    }
    return NextResponse.json({ message: `Etapa atualizada para ${etapa_atual}` })
  } catch (error) {
    console.error('Update session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

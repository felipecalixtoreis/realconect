import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's active session
    const { data: session, error } = await supabase
      .from('experiment_session')
      .select(`
        *,
        user1:profiles!experiment_session_user1_id_fkey(id, nome, email),
        user2:profiles!experiment_session_user2_id_fkey(id, nome, email)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('criado_em', { ascending: false })
      .limit(1)
      .single()

    if (error || !session) {
      return NextResponse.json({ session: null })
    }

    // Get all responses for this session
    const { data: respostas } = await supabase
      .from('respostas')
      .select('*')
      .eq('session_id', session.id)
      .order('etapa')

    // Get all indices for this session
    const { data: indices } = await supabase
      .from('indices')
      .select('*')
      .eq('session_id', session.id)
      .order('etapa')

    // Get timeline
    const { data: timeline } = await supabase
      .from('timeline')
      .select('*')
      .eq('session_id', session.id)
      .order('data_evento')

    // Filter out other user's responses that haven't been authorized for display
    const respostasFiltradas = (respostas || []).map((r: any) => {
      if (r.user_id !== user.id && !r.autorizar_exibicao) {
        // Hide the response text, but keep metadata so we know they responded
        return { ...r, resposta: null, opcoes_selecionadas: null }
      }
      return r
    })

    return NextResponse.json({
      session,
      respostas: respostasFiltradas,
      indices: indices || [],
      timeline: timeline || [],
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

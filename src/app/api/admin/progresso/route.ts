import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET - Acompanhamento de uma sessão: respostas + desejos (genie) + índices por etapa.
// Usado pelo painel admin para a visão "Acompanhamento por Etapa".
export async function GET(request: NextRequest) {
  try {
    // Auth (o middleware já protege /api/admin, mas reforçamos aqui)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id é obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()

    const [respostasRes, desejosRes, indicesRes] = await Promise.all([
      admin.from('respostas').select('*').eq('session_id', sessionId).order('etapa', { ascending: true }),
      admin.from('genie_interactions').select('*').eq('session_id', sessionId)
        .order('etapa', { ascending: true }).order('interaction_number', { ascending: true }),
      admin.from('indices').select('*').eq('session_id', sessionId).order('etapa', { ascending: true }),
    ])

    return NextResponse.json({
      respostas: respostasRes.data || [],
      desejos: desejosRes.data || [],
      indices: indicesRes.data || [],
    })
  } catch (error) {
    console.error('Admin progresso error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

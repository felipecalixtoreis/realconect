import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gerarDicaEros } from '@/lib/openai'
import { ETAPAS } from '@/lib/etapas'
import { buscarHistoricoAcumulado } from '@/lib/historico'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const session_id = searchParams.get('session_id')
    const etapa = searchParams.get('etapa')

    if (!session_id || !etapa) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: hint } = await admin
      .from('eros_hints')
      .select('*')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .eq('etapa', Number(etapa))
      .single()

    return NextResponse.json({
      hint: hint?.hint_text || null,
      used: !!hint,
    })
  } catch (error) {
    console.error('Eros hint GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { session_id, etapa } = await request.json()
    if (!session_id || !etapa) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Check if hint already used
    const { data: existing } = await admin
      .from('eros_hints')
      .select('hint_text')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .eq('etapa', etapa)
      .single()

    if (existing) {
      return NextResponse.json({ hint: existing.hint_text, already_used: true })
    }

    // Get user profile
    const { data: profile } = await admin
      .from('profiles')
      .select('nome')
      .eq('id', user.id)
      .single()

    // Get admin context
    const { data: contextos } = await admin
      .from('admin_context')
      .select('contexto')
      .or(`session_id.eq.${session_id},user_id.eq.${user.id}`)

    const etapaInfo = ETAPAS.find(e => e.numero === etapa)

    // Fetch accumulated history for richer, personalized hints
    const historicoAcumulado = await buscarHistoricoAcumulado(admin, session_id, user.id)

    const hintText = await gerarDicaEros({
      etapa,
      tituloEtapa: etapaInfo?.titulo || `Etapa ${etapa}`,
      perguntaEtapa: etapaInfo?.pergunta || '',
      nomeUsuario: profile?.nome || 'Participante',
      contextoAdmin: contextos?.map(c => c.contexto).join('\n') || undefined,
      historicoAcumulado,
    })

    // Save hint
    await admin.from('eros_hints').insert({
      session_id,
      user_id: user.id,
      etapa,
      hint_text: hintText,
    })

    return NextResponse.json({ hint: hintText })
  } catch (error) {
    console.error('Eros hint POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

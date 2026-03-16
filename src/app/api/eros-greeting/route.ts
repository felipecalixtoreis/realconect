import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gerarSaudacaoEros } from '@/lib/openai'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const etapaAtual = parseInt(searchParams.get('etapa_atual') || '1')
    const nomeUsuario = searchParams.get('nome') || 'Participante'

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id obrigatório' }, { status: 400 })
    }

    // Get user's previous responses
    const { data: respostas } = await supabase
      .from('respostas')
      .select('etapa, resposta_texto')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('etapa', { ascending: true })

    const totalRespondidas = respostas?.length || 0

    // First time ever - use the fixed greeting
    if (totalRespondidas === 0) {
      const primeiro = nomeUsuario.split(' ')[0] || nomeUsuario
      return NextResponse.json({
        greeting: `Eu sou Eros. Não, você não me conhece, mas eu conheço você. Sou a força primordial que existia antes dos próprios deuses. Multiplique o infinito pela eternidade e talvez tenha um vislumbre sobre mim. Você não precisa se apresentar. Sei que você é ${primeiro}. Sei o porquê de você estar aqui, além mesmo do que você pensa ter te trazido até aqui. O experimento já começou antes do que você imagina. Então siga em frente.`,
        dynamic: false,
      })
    }

    // Fetch admin context (personality profiles) for this user
    const admin = createAdminClient()
    const { data: contextos } = await admin
      .from('admin_context')
      .select('contexto')
      .or(`session_id.eq.${sessionId},user_id.eq.${user.id}`)

    const contextoAdmin = contextos?.map(c => c.contexto).join('\n') || undefined

    // All completed
    if (totalRespondidas >= 6) {
      const greeting = await gerarSaudacaoEros({
        nomeUsuario,
        etapaAtual: 7,
        totalRespondidas,
        respostasAnteriores: (respostas || []).map(r => ({
          etapa: r.etapa,
          resposta: r.resposta_texto || '',
        })),
        contextoAdmin,
      })
      return NextResponse.json({ greeting, dynamic: true })
    }

    // Dynamic greeting based on context
    const greeting = await gerarSaudacaoEros({
      nomeUsuario,
      etapaAtual,
      totalRespondidas,
      respostasAnteriores: (respostas || []).map(r => ({
        etapa: r.etapa,
        resposta: r.resposta_texto || '',
      })),
      contextoAdmin,
    })

    return NextResponse.json({ greeting, dynamic: true })
  } catch (error) {
    console.error('Eros greeting error:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar saudação' },
      { status: 500 }
    )
  }
}

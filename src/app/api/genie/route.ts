import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chatComEros } from '@/lib/openai'
import { ETAPAS } from '@/lib/etapas'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const session_id = searchParams.get('session_id')
    const etapa = searchParams.get('etapa')

    if (!session_id || !etapa) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: interactions } = await admin
      .from('genie_interactions')
      .select('*')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .eq('etapa', Number(etapa))
      .order('interaction_number', { ascending: true })

    return NextResponse.json({
      interactions: interactions || [],
      remaining: 3 - (interactions?.length || 0),
    })
  } catch (error) {
    console.error('Genie GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { session_id, etapa, pergunta } = await request.json()

    if (!session_id || !etapa || !pergunta) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Check how many interactions already exist
    const { data: existing } = await admin
      .from('genie_interactions')
      .select('*')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .eq('etapa', etapa)
      .order('interaction_number', { ascending: true })

    const count = existing?.length || 0
    if (count >= 3) {
      return NextResponse.json({
        error: 'Você já usou seus 3 pedidos com Eros nesta etapa.',
        remaining: 0,
      }, { status: 429 })
    }

    // Get user's response for this stage
    const { data: minhaResposta } = await admin
      .from('respostas')
      .select('resposta')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .eq('etapa', etapa)
      .single()

    if (!minhaResposta) {
      return NextResponse.json({
        error: 'Você precisa responder a pergunta desta etapa antes de consultar Eros.',
      }, { status: 400 })
    }

    // Get other user's response (if exists)
    const { data: outraResposta } = await admin
      .from('respostas')
      .select('resposta')
      .eq('session_id', session_id)
      .neq('user_id', user.id)
      .eq('etapa', etapa)
      .single()

    // Get user profile name
    const { data: profile } = await admin
      .from('profiles')
      .select('nome')
      .eq('id', user.id)
      .single()

    // Get the other participant's profile
    const { data: outroProfile } = await admin
      .from('profiles')
      .select('nome')
      .neq('id', user.id)
      .limit(1)
      .single()

    // Get ALL admin contexts (session-wide + both users' profiles)
    const { data: contextos } = await admin
      .from('admin_context')
      .select('contexto, user_id')
      .or(`session_id.eq.${session_id},user_id.eq.${user.id},user_id.is.null`)

    // Get the other user's contexts separately
    const { data: session } = await admin
      .from('experiment_session')
      .select('user1_id, user2_id')
      .eq('id', session_id)
      .single()

    const outroUserId = session?.user1_id === user.id ? session?.user2_id : session?.user1_id

    const { data: outroContextos } = outroUserId ? await admin
      .from('admin_context')
      .select('contexto')
      .eq('user_id', outroUserId) : { data: [] }

    const contextoAdmin = contextos?.map(c => c.contexto).join('\n') || undefined
    const perfilOutro = outroContextos?.map(c => c.contexto).join('\n') || undefined

    const etapaInfo = ETAPAS.find(e => e.numero === etapa)

    // Build chat history
    const historico = (existing || []).map(i => ({
      pergunta: i.pergunta,
      resposta: i.resposta,
    }))

    // Call Eros
    const respostaEros = await chatComEros(pergunta, {
      etapa,
      tituloEtapa: etapaInfo?.titulo || `Etapa ${etapa}`,
      respostaUsuario: minhaResposta.resposta,
      respostaOutro: outraResposta?.resposta,
      historicoChat: historico,
      nomeUsuario: profile?.nome || 'Participante',
      nomeOutro: outroProfile?.nome || 'o outro participante',
      contextoAdmin,
      perfilOutro,
    })

    // Save interaction
    const interactionNumber = count + 1
    const { data: saved, error: saveError } = await admin
      .from('genie_interactions')
      .insert({
        session_id,
        user_id: user.id,
        etapa,
        interaction_number: interactionNumber,
        pergunta,
        resposta: respostaEros,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving genie interaction:', saveError)
      return NextResponse.json({ error: 'Failed to save interaction' }, { status: 500 })
    }

    return NextResponse.json({
      interaction: saved,
      remaining: 3 - interactionNumber,
    })
  } catch (error) {
    console.error('Genie POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

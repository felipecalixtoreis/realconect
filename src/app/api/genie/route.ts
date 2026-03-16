import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chatComEros } from '@/lib/openai'
import { ETAPAS } from '@/lib/etapas'
import { buscarHistoricoAcumulado } from '@/lib/historico'

// ── Detecção de pedido de "mais desejos" ──────────────────────────────
const BONUS_PATTERNS = [
  /mais\s*(3|três|tres)\s*(desejos?|pedidos?|wishes?)/i,
  /quero\s*mais\s*(desejos?|pedidos?)/i,
  /(me\s*)?(dê|da|conceda|dá)\s*mais\s*(desejos?|pedidos?)/i,
  /(3|três|tres)\s*(desejos?|pedidos?)\s*(extras?|a\s*mais)/i,
  /mais\s*(desejos?|pedidos?)\s*(extras?|por\s*favor)?/i,
  /pedir\s*mais\s*(desejos?|pedidos?)/i,
  /desejo\s*(ter\s*)?mais\s*(desejos?|pedidos?)/i,
  /aumentar?\s*(os?\s*)?(desejos?|pedidos?)/i,
]

function isAskingForMoreWishes(text: string): boolean {
  return BONUS_PATTERNS.some(p => p.test(text))
}

// ── Mensagem especial do Eros ao conceder bônus ──────────────────────
const BONUS_EROS_MESSAGE = `Esta foi a única vez que irei permitir que você tome atalhos para obter sabedoria, não quero ser uma muleta para você, mas quero ser um trampolim que irá lhe permitir mergulhar na imensidão de uma vida cheia de propósitos, com leveza, com alguém que pode viver o extraordinário com você... e para isso não há atalhos, só é preciso coragem, e perceber realmente quem é o outro?! Então agora, antes de conceder um desejo extra, quem pergunta agora sou eu! Você está conseguindo perceber Samira? Acha que está pronta para o que pode acontecer?  E olha... eu sei que já pensou nisso!`

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

    // Buscar interações desta etapa
    const { data: interactions } = await admin
      .from('genie_interactions')
      .select('*')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .eq('etapa', Number(etapa))
      .order('interaction_number', { ascending: true })

    // Verificar se bonus foi concedido nesta etapa
    const { data: bonus } = await admin
      .from('bonus_wishes')
      .select('etapa')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .single()

    const bonusActiveThisStage = bonus?.etapa === Number(etapa)
    const maxWishes = bonusActiveThisStage ? 4 : 3
    const count = interactions?.length || 0

    return NextResponse.json({
      interactions: interactions || [],
      remaining: Math.max(0, maxWishes - count),
      max_wishes: maxWishes,
      bonus_granted: !!bonus,
      bonus_stage: bonus?.etapa || null,
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

    // Buscar interações existentes nesta etapa
    const { data: existing } = await admin
      .from('genie_interactions')
      .select('*')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .eq('etapa', etapa)
      .order('interaction_number', { ascending: true })

    const count = existing?.length || 0

    // Verificar se bonus já foi concedido (globalmente, qualquer etapa)
    const { data: bonusRecord } = await admin
      .from('bonus_wishes')
      .select('*')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .single()

    const bonusActiveThisStage = bonusRecord?.etapa === etapa
    const maxWishes = bonusActiveThisStage ? 4 : 3

    if (count >= maxWishes) {
      return NextResponse.json({
        error: bonusActiveThisStage
          ? 'Você já usou todos os seus 4 pedidos nesta etapa.'
          : 'Você já usou seus 3 pedidos com Eros nesta etapa.',
        remaining: 0,
      }, { status: 429 })
    }

    // ── Detectar pedido de mais desejos ──────────────────────────────
    if (isAskingForMoreWishes(pergunta) && count < 3) {
      // Só concede se:
      // 1. Ainda está dentro dos 3 primeiros desejos
      // 2. Bonus NUNCA foi concedido antes neste experimento
      if (!bonusRecord) {
        // Conceder bonus!
        const interactionNumber = count + 1

        // Salvar a interação com a resposta especial
        const { data: saved, error: saveError } = await admin
          .from('genie_interactions')
          .insert({
            session_id,
            user_id: user.id,
            etapa,
            interaction_number: interactionNumber,
            pergunta,
            resposta: BONUS_EROS_MESSAGE,
          })
          .select()
          .single()

        if (saveError) {
          console.error('Error saving bonus interaction:', saveError)
          return NextResponse.json({ error: 'Failed to save interaction' }, { status: 500 })
        }

        // Registrar concessão do bônus
        await admin.from('bonus_wishes').insert({
          session_id,
          user_id: user.id,
          etapa,
        })

        // Agora o max é 4 para esta etapa (3 + 1 extra)
        const newMax = 4

        return NextResponse.json({
          interaction: saved,
          remaining: newMax - interactionNumber,
          max_wishes: newMax,
          bonus_just_granted: true,
        })
      }
      // Se bonus já foi concedido antes, trata como pedido normal
      // (Eros responderá naturalmente via IA)
    }

    // ── Fluxo normal ────────────────────────────────────────────────

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

    // Find the other user's ID
    const { data: session } = await admin
      .from('experiment_session')
      .select('user1_id, user2_id')
      .eq('id', session_id)
      .single()

    const outroUserId = session?.user1_id === user.id ? session?.user2_id : session?.user1_id

    // Get admin contexts for both users
    const { data: contextos } = await admin
      .from('admin_context')
      .select('contexto, user_id')
      .or(`session_id.eq.${session_id},user_id.eq.${user.id},user_id.is.null`)

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

    // Fetch accumulated history for both users
    const [historicoAcumulado, historicoOutro] = await Promise.all([
      buscarHistoricoAcumulado(admin, session_id, user.id),
      outroUserId ? buscarHistoricoAcumulado(admin, session_id, outroUserId) : Promise.resolve(undefined),
    ])

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
      historicoAcumulado,
      historicoOutro: historicoOutro || undefined,
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
      remaining: maxWishes - interactionNumber,
      max_wishes: maxWishes,
    })
  } catch (error) {
    console.error('Genie POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chatComEros } from '@/lib/openai'
import { ETAPAS } from '@/lib/etapas'
import { buscarHistoricoAcumulado } from '@/lib/historico'

// ── Mesma detecção do endpoint real ──────────────────────────────────
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

const BONUS_EROS_MESSAGE = `Esta será a única vez que irei permitir que você tome atalhos para obter sabedoria, não quero ser uma muleta para você, mas quero ser um trampolim que irá lhe permitir mergulhar na imensidão de uma vida cheia de propósitos, com leveza, com alguém que pode viver o extraordinário com você... e para isso não há atalhos, só é preciso coragem, e perceber realmente quem é o outro. Então agora, antes de conceder um desejo extra, quem pergunta sou eu! Você está conseguindo perceber Samira? Acha que está pronta para o que pode acontecer? E olha... eu sei... sei que já pensou nisso!`

/**
 * POST /api/admin/test-genie
 *
 * Simula uma interação com o Eros em modo sandbox.
 * - Usa os dados reais do banco (perfil, contexto, histórico) para fidelidade
 * - NÃO salva nada no banco — apenas retorna a resposta que o Eros daria
 * - Aceita um histórico de chat fictício para simular múltiplas interações
 */
export async function POST(request: NextRequest) {
  try {
    const {
      session_id,
      user_id,
      etapa,
      pergunta,
      sandbox_history = [],    // [{pergunta, resposta}] — simulações anteriores
      sandbox_count = 0,       // quantas interações já foram feitas no sandbox
      bonus_already_granted = false,
    } = await request.json()

    if (!session_id || !user_id || !etapa || !pergunta) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // ── Detectar pedido de mais desejos ──────────────────────────────
    const count = sandbox_count
    if (isAskingForMoreWishes(pergunta) && count < 3 && !bonus_already_granted) {
      return NextResponse.json({
        resposta: BONUS_EROS_MESSAGE,
        bonus_just_granted: true,
        detected_bonus_request: true,
        interaction_number: count + 1,
        remaining: 4 - (count + 1),
        max_wishes: 4,
      })
    }

    // ── Buscar dados reais para contexto fiel ────────────────────────

    // Resposta do usuário nesta etapa (real)
    const { data: minhaResposta } = await admin
      .from('respostas')
      .select('resposta')
      .eq('session_id', session_id)
      .eq('user_id', user_id)
      .eq('etapa', etapa)
      .single()

    // Resposta do outro (real)
    const { data: outraResposta } = await admin
      .from('respostas')
      .select('resposta')
      .eq('session_id', session_id)
      .neq('user_id', user_id)
      .eq('etapa', etapa)
      .single()

    // Perfil do usuário
    const { data: profile } = await admin
      .from('profiles')
      .select('nome')
      .eq('id', user_id)
      .single()

    // Perfil do outro participante
    const { data: session } = await admin
      .from('experiment_session')
      .select('user1_id, user2_id')
      .eq('id', session_id)
      .single()

    const outroUserId = session?.user1_id === user_id ? session?.user2_id : session?.user1_id

    const { data: outroProfile } = outroUserId ? await admin
      .from('profiles')
      .select('nome')
      .eq('id', outroUserId)
      .single() : { data: null }

    // Contextos admin
    const { data: contextos } = await admin
      .from('admin_context')
      .select('contexto, user_id')
      .or(`session_id.eq.${session_id},user_id.eq.${user_id},user_id.is.null`)

    const { data: outroContextos } = outroUserId ? await admin
      .from('admin_context')
      .select('contexto')
      .eq('user_id', outroUserId) : { data: [] }

    const contextoAdmin = contextos?.map(c => c.contexto).join('\n') || undefined
    const perfilOutro = outroContextos?.map(c => c.contexto).join('\n') || undefined

    const etapaInfo = ETAPAS.find(e => e.numero === etapa)

    // Histórico acumulado real
    const [historicoAcumulado, historicoOutro] = await Promise.all([
      buscarHistoricoAcumulado(admin, session_id, user_id),
      outroUserId ? buscarHistoricoAcumulado(admin, session_id, outroUserId) : Promise.resolve(undefined),
    ])

    // ── Chamar Eros com histórico sandbox ────────────────────────────
    const respostaEros = await chatComEros(pergunta, {
      etapa,
      tituloEtapa: etapaInfo?.titulo || `Etapa ${etapa}`,
      respostaUsuario: minhaResposta?.resposta || '(resposta não disponível — teste sandbox)',
      respostaOutro: outraResposta?.resposta,
      historicoChat: sandbox_history,
      nomeUsuario: profile?.nome || 'Participante',
      nomeOutro: outroProfile?.nome || 'o outro participante',
      contextoAdmin,
      perfilOutro,
      historicoAcumulado,
      historicoOutro: historicoOutro || undefined,
    })

    const maxWishes = bonus_already_granted ? 4 : 3

    return NextResponse.json({
      resposta: respostaEros,
      bonus_just_granted: false,
      detected_bonus_request: false,
      interaction_number: count + 1,
      remaining: maxWishes - (count + 1),
      max_wishes: maxWishes,
    })
  } catch (error) {
    console.error('Test genie error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

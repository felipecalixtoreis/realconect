import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Public API — returns the current stage progress without authentication
// This is used by the landing page to show progressive text reveal
export async function GET() {
  try {
    const admin = createAdminClient()

    // Get the most recent session (active or encerrado)
    const { data: session } = await admin
      .from('experiment_session')
      .select('id, etapa_atual, status')
      .in('status', ['ativo', 'encerrado'])
      .order('criado_em', { ascending: false })
      .limit(1)
      .single()

    if (!session) {
      return NextResponse.json({ etapa_atual: 0, respostas_count: 0, encerrado: false })
    }

    // Count completed responses (both participants)
    const { count } = await admin
      .from('respostas')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id)

    // The "unlock level" is the minimum completed stage across both users
    // Get per-user max etapa
    const { data: respostas } = await admin
      .from('respostas')
      .select('user_id, etapa')
      .eq('session_id', session.id)

    let etapaDesbloqueada = 0
    if (respostas && respostas.length > 0) {
      // Group by user
      const porUsuario: Record<string, number[]> = {}
      for (const r of respostas) {
        if (!porUsuario[r.user_id]) porUsuario[r.user_id] = []
        porUsuario[r.user_id].push(r.etapa)
      }

      const usuarios = Object.values(porUsuario)
      if (usuarios.length === 2) {
        // Both answered — unlock level = min of max etapa between both
        const max1 = Math.max(...usuarios[0])
        const max2 = Math.max(...usuarios[1])
        etapaDesbloqueada = Math.min(max1, max2)
      } else if (usuarios.length === 1) {
        // Only one answered
        etapaDesbloqueada = Math.max(...usuarios[0])
      }
    }

    return NextResponse.json({
      etapa_atual: session.etapa_atual,
      etapa_desbloqueada: etapaDesbloqueada,
      respostas_count: count || 0,
      encerrado: session.status === 'encerrado',
    })
  } catch (error) {
    return NextResponse.json({ etapa_atual: 0, etapa_desbloqueada: 0 })
  }
}

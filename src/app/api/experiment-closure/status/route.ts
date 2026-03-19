import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET — fetch closure status of the OTHER participant (for Felipe's dashboard)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const session_id = searchParams.get('session_id')
    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Find the other user in this session
    const { data: session } = await admin
      .from('experiment_session')
      .select('user1_id, user2_id')
      .eq('id', session_id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const otherUserId = session.user1_id === user.id ? session.user2_id : session.user1_id

    // Check if the other user has visited/responded
    const { data: closure } = await admin
      .from('experiment_closure')
      .select('resposta, visitado_em, criado_em')
      .eq('session_id', session_id)
      .eq('user_id', otherUserId)
      .single()

    return NextResponse.json({
      visitado_em: closure?.visitado_em || null,
      resposta: closure?.resposta || null,
      respondido_em: closure?.criado_em || null,
    })
  } catch (error) {
    console.error('Closure status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

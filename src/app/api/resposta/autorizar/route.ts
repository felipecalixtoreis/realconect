import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { session_id, etapa, autorizar } = await request.json()

    if (!session_id || !etapa || autorizar === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Use admin client to bypass RLS (no UPDATE policy on respostas)
    const admin = createAdminClient()
    const { error } = await admin
      .from('respostas')
      .update({ autorizar_exibicao: autorizar })
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .eq('etapa', etapa)

    if (error) {
      console.error('Error updating authorization:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Authorization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

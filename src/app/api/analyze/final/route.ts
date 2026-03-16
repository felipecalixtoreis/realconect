import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gerarResumoFinal } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { session_id } = await request.json()

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Fetch all indices
    const { data: indices } = await adminClient
      .from('indices')
      .select('*')
      .eq('session_id', session_id)
      .order('etapa')

    if (!indices || indices.length === 0) {
      return NextResponse.json({ error: 'No analysis data found' }, { status: 404 })
    }

    // Fetch admin context
    const { data: contextos } = await adminClient
      .from('admin_context')
      .select('contexto')
      .eq('session_id', session_id)

    const contextoAdmin = contextos?.map(c => c.contexto).join('\n') || undefined

    // Generate final summary
    const resultado = await gerarResumoFinal(indices, contextoAdmin)

    // Update session status
    await adminClient
      .from('experiment_session')
      .update({ status: 'concluido' })
      .eq('id', session_id)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Final analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

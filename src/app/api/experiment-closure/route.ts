import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET — check if user already left final words
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
    const { data } = await admin
      .from('experiment_closure')
      .select('resposta, criado_em')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ resposta: data?.resposta || null, criado_em: data?.criado_em || null })
  } catch (error) {
    console.error('Closure GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — save final words
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { session_id, resposta } = await request.json()
    if (!session_id || !resposta) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify session is in 'encerrado' status
    const { data: session } = await admin
      .from('experiment_session')
      .select('status')
      .eq('id', session_id)
      .single()

    if (!session || session.status !== 'encerrado') {
      return NextResponse.json({ error: 'Experiment is not in closure state' }, { status: 400 })
    }

    // Check if already submitted
    const { data: existing } = await admin
      .from('experiment_closure')
      .select('id')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 409 })
    }

    // Save final words
    const { error: insertError } = await admin
      .from('experiment_closure')
      .insert({
        session_id,
        user_id: user.id,
        resposta: resposta.slice(0, 500),
      })

    if (insertError) {
      console.error('Closure insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Closure POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

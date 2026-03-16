import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { session_id, user_id, contexto } = await request.json()
    const admin = createAdminClient()

    const { error } = await admin
      .from('admin_context')
      .insert({
        session_id: session_id || null,
        user_id: user_id || null,
        contexto,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Contexto adicionado com sucesso!' })
  } catch (error) {
    console.error('Add context error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

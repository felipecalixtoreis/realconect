import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET — list all hint overrides
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: hints, error } = await admin
      .from('hint_overrides')
      .select('*')
      .order('etapa', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ hints: hints || [] })
  } catch (error) {
    console.error('GET hints error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create or update a hint override (upsert)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { user_id, etapa, hint_text } = await request.json()

    if (!user_id || !etapa || !hint_text?.trim()) {
      return NextResponse.json({ error: 'user_id, etapa e hint_text são obrigatórios' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from('hint_overrides')
      .upsert(
        { user_id, etapa, hint_text: hint_text.trim() },
        { onConflict: 'user_id,etapa' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Also clear any existing generated hint so the override takes effect
    await admin
      .from('eros_hints')
      .delete()
      .eq('user_id', user_id)
      .eq('etapa', etapa)

    return NextResponse.json({ message: 'Dica personalizada salva com sucesso!' })
  } catch (error) {
    console.error('POST hints error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — remove a hint override
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('hint_overrides')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: 'Dica personalizada excluída!' })
  } catch (error) {
    console.error('DELETE hints error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

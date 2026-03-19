import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: responses } = await admin
      .from('experiment_closure')
      .select('*, profiles(nome)')
      .order('criado_em', { ascending: true })

    return NextResponse.json({ responses: responses || [] })
  } catch (error) {
    console.error('Admin closure error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

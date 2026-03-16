import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const [sessionsRes, profilesRes, contextosRes] = await Promise.all([
      admin.from('experiment_session').select('*').order('criado_em', { ascending: false }),
      admin.from('profiles').select('*'),
      admin.from('admin_context').select('*').order('criado_em', { ascending: false }),
    ])

    return NextResponse.json({
      sessions: sessionsRes.data || [],
      profiles: profilesRes.data || [],
      contextos: contextosRes.data || [],
    })
  } catch (error) {
    console.error('Admin data error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

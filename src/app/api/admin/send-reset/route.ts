import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Get the origin from the request to build the redirect URL
    const origin = request.headers.get('origin') || 'https://realconect.com'

    const { error } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/set-password`,
    })

    if (error) {
      console.error('Reset password error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: `Link de criação de senha enviado para ${email}!` })
  } catch (error) {
    console.error('Send reset error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

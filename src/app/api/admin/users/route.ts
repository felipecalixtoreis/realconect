import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    // Verify caller is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user_id, email, password, nome } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()
    const updates: Record<string, any> = {}

    // Update auth email and/or password
    if (email || password) {
      const authUpdates: Record<string, any> = {}
      if (email) authUpdates.email = email
      if (password) authUpdates.password = password

      const { error: authError } = await admin.auth.admin.updateUserById(
        user_id,
        authUpdates
      )

      if (authError) {
        console.error('Auth update error:', authError)
        return NextResponse.json({ error: `Erro ao atualizar auth: ${authError.message}` }, { status: 500 })
      }
    }

    // Update profile name/email
    const profileUpdates: Record<string, any> = {}
    if (nome) profileUpdates.nome = nome
    if (email) profileUpdates.email = email

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await admin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user_id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        return NextResponse.json({ error: `Erro ao atualizar perfil: ${profileError.message}` }, { status: 500 })
      }
    }

    const messages = []
    if (email) messages.push('Email atualizado')
    if (password) messages.push('Senha definida')
    if (nome) messages.push('Nome atualizado')

    return NextResponse.json({
      message: messages.join(', ') + ' com sucesso!',
    })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

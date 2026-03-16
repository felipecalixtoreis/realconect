import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET — load all etapas from database
export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('etapas_config')
      .select('*')
      .order('numero')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ etapas: data || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update a specific etapa
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { numero, titulo, subtitulo, narrativa, pergunta, tipo_resposta, max_caracteres, opcoes, imagem_url, tipo_indice } = body

    if (!numero) {
      return NextResponse.json({ error: 'Número da etapa obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()
    const updates: Record<string, any> = {}
    if (titulo !== undefined) updates.titulo = titulo
    if (subtitulo !== undefined) updates.subtitulo = subtitulo
    if (narrativa !== undefined) updates.narrativa = narrativa
    if (pergunta !== undefined) updates.pergunta = pergunta
    if (tipo_resposta !== undefined) updates.tipo_resposta = tipo_resposta
    if (max_caracteres !== undefined) updates.max_caracteres = max_caracteres
    if (opcoes !== undefined) updates.opcoes = opcoes
    if (imagem_url !== undefined) updates.imagem_url = imagem_url
    if (tipo_indice !== undefined) updates.tipo_indice = tipo_indice

    const { error } = await admin
      .from('etapas_config')
      .update(updates)
      .eq('numero', numero)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: `Etapa ${numero} atualizada!` })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

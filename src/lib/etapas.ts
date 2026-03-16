export interface Etapa {
  numero: number
  titulo: string
  subtitulo: string
  narrativa: string
  pergunta: string
  tipoResposta: 'texto' | 'multipla_escolha'
  maxCaracteres: number
  opcoes?: string[]
  imagemUrl: string
  tipoIndice: string
}

export const ETAPAS: Etapa[] = [
  {
    numero: 1,
    titulo: "Primeiro Contato",
    subtitulo: "Curiosidade",
    narrativa: "Toda conexão começa com uma pergunta e uma resposta sincera.\nNesta etapa, {nome}, você deve refletir sobre o que faz uma conversa valer a pena para você.",
    pergunta: "O que faz você sentir que uma conversa valeu a pena?",
    tipoResposta: 'texto',
    maxCaracteres: 200,
    imagemUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    tipoIndice: "curiosidade"
  },
  {
    numero: 2,
    titulo: "Ideias que Transformam",
    subtitulo: "Descoberta",
    narrativa: "Mentes curiosas são transformadas por ideias, {nome}.\nPense naquela ideia que mudou completamente a forma como você enxerga o mundo ao seu redor.",
    pergunta: "Qual ideia filosófica ou científica mais mudou sua forma de ver o mundo?",
    tipoResposta: 'texto',
    maxCaracteres: 300,
    imagemUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    tipoIndice: "intelectual"
  },
  {
    numero: 3,
    titulo: "O Que Te Faz Sentir Vivo(a)",
    subtitulo: "Afinidades",
    narrativa: "Nem toda experiência é igual, {nome}.\nAlgumas nos fazem sentir verdadeiramente vivos.\nQual tipo de experiência desperta isso em você?",
    pergunta: "Que tipo de experiência te faz sentir verdadeiramente vivo(a)?",
    tipoResposta: 'multipla_escolha',
    maxCaracteres: 200,
    opcoes: [
      "Descoberta intelectual",
      "Conexão com natureza",
      "Criatividade",
      "Intimidade emocional",
      "Aventura"
    ],
    imagemUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
    tipoIndice: "afinidades"
  },
  {
    numero: 4,
    titulo: "Depois do Encontro",
    subtitulo: "Experiência Real",
    narrativa: "Experimentos ganham significado quando saem do digital, {nome}.\nApós viverem uma experiência juntos, reflita sobre o que ficou marcado.",
    pergunta: "Qual foi o momento mais autêntico do nosso encontro?",
    tipoResposta: 'texto',
    maxCaracteres: 500,
    imagemUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    tipoIndice: "experiencia"
  },
  {
    numero: 5,
    titulo: "O Que Tememos",
    subtitulo: "Vulnerabilidade",
    narrativa: "Verdadeira conexão exige vulnerabilidade, {nome}.\nCompartilhar o que nos assusta é um ato de coragem que poucos se permitem.",
    pergunta: "O que você mais teme em um relacionamento?",
    tipoResposta: 'texto',
    maxCaracteres: 300,
    imagemUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80",
    tipoIndice: "emocional"
  },
  {
    numero: 6,
    titulo: "O Experimento Revelado",
    subtitulo: "Revelação Final",
    narrativa: "{nome}, este experimento não era sobre compatibilidade.\n\nEra sobre descobrir se duas pessoas curiosas poderiam construir algo genuíno juntas.\n\nE parece que a resposta é sim.",
    pergunta: "O que este experimento significou para você?",
    tipoResposta: 'texto',
    maxCaracteres: 500,
    imagemUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=80",
    tipoIndice: "conexao"
  }
]

export function getNarrativaPersonalizada(narrativa: string, nomeUsuario: string): string {
  const primeiroNome = nomeUsuario.split(' ')[0] || nomeUsuario
  return narrativa.replace(/\{nome\}/g, primeiroNome)
}

// Convert database row to Etapa interface
function dbToEtapa(row: any): Etapa {
  return {
    numero: row.numero,
    titulo: row.titulo,
    subtitulo: row.subtitulo,
    narrativa: row.narrativa,
    pergunta: row.pergunta,
    tipoResposta: row.tipo_resposta as 'texto' | 'multipla_escolha',
    maxCaracteres: row.max_caracteres,
    opcoes: row.opcoes || undefined,
    imagemUrl: row.imagem_url || '',
    tipoIndice: row.tipo_indice,
  }
}

// Server-side function to load etapas from database (with fallback to hardcoded)
export async function getEtapasFromDB(): Promise<Etapa[]> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('etapas_config')
      .select('*')
      .order('numero')

    if (error || !data || data.length === 0) {
      return ETAPAS // fallback to hardcoded
    }

    return data.map(dbToEtapa)
  } catch {
    return ETAPAS // fallback to hardcoded
  }
}

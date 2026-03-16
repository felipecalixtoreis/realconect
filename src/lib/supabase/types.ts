export interface User {
  id: string
  email: string
  nome: string
  criado_em: string
}

export interface ExperimentSession {
  id: string
  user1_id: string
  user2_id: string
  status: 'ativo' | 'concluido'
  criado_em: string
  etapa_atual: number
}

export interface Resposta {
  id: string
  session_id: string
  user_id: string
  etapa: number
  resposta: string
  criado_em: string
}

export interface Indice {
  id: string
  session_id: string
  etapa: number
  tipo_indice: string
  valor_user1: number
  valor_user2: number
  compatibilidade: number
  criado_em: string
}

export interface TimelineEvent {
  id: string
  session_id: string
  data_evento: string
  titulo: string
  descricao: string
  tipo: 'pergunta' | 'encontro' | 'descoberta'
}

export interface AdminContext {
  id: string
  session_id: string
  user_id: string
  contexto: string
  criado_em: string
}

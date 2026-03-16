-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela: profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  nome VARCHAR NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: experiment_session
CREATE TABLE experiment_session (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  etapa_atual INT NOT NULL DEFAULT 1 CHECK (etapa_atual BETWEEN 1 AND 6)
);

-- Tabela: respostas
CREATE TABLE respostas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES experiment_session(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  etapa INT NOT NULL CHECK (etapa BETWEEN 1 AND 6),
  resposta TEXT NOT NULL,
  opcoes_selecionadas TEXT[] DEFAULT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id, etapa)
);

-- Tabela: indices
CREATE TABLE indices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES experiment_session(id) ON DELETE CASCADE,
  etapa INT NOT NULL CHECK (etapa BETWEEN 1 AND 6),
  tipo_indice VARCHAR NOT NULL,
  valor_user1 INT CHECK (valor_user1 BETWEEN 0 AND 100),
  valor_user2 INT CHECK (valor_user2 BETWEEN 0 AND 100),
  compatibilidade INT CHECK (compatibilidade BETWEEN 0 AND 100),
  padroes_semelhantes TEXT[] DEFAULT NULL,
  diferencas_crescimento TEXT[] DEFAULT NULL,
  resumo TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: timeline
CREATE TABLE timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES experiment_session(id) ON DELETE CASCADE,
  data_evento DATE DEFAULT CURRENT_DATE,
  titulo VARCHAR NOT NULL,
  descricao TEXT,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('pergunta', 'encontro', 'descoberta'))
);

-- Tabela: admin_context (conhecimentos sobre participantes para a IA)
CREATE TABLE admin_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES experiment_session(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contexto TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: genie_interactions (Lúminis)
CREATE TABLE genie_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES experiment_session(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  etapa INT NOT NULL CHECK (etapa BETWEEN 1 AND 6),
  interaction_number INT NOT NULL CHECK (interaction_number BETWEEN 1 AND 6),
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id, etapa, interaction_number)
);

-- Tabela: eros_hints (dicas do Eros, 1 por etapa)
CREATE TABLE eros_hints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES experiment_session(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  etapa INT NOT NULL CHECK (etapa BETWEEN 1 AND 6),
  hint_text TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id, etapa)
);

-- Indexes
CREATE INDEX idx_genie_session_user_etapa ON genie_interactions(session_id, user_id, etapa);
CREATE INDEX idx_respostas_session ON respostas(session_id);
CREATE INDEX idx_respostas_user ON respostas(user_id);
CREATE INDEX idx_indices_session ON indices(session_id);
CREATE INDEX idx_timeline_session ON timeline(session_id);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE genie_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE eros_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_context ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies for experiment_session
CREATE POLICY "Users can view their sessions"
  ON experiment_session FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Policies for respostas
CREATE POLICY "Users can insert their own responses"
  ON respostas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view responses in their session"
  ON respostas FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM experiment_session
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Policies for indices
CREATE POLICY "Users can view indices in their session"
  ON indices FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM experiment_session
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Policies for timeline
CREATE POLICY "Users can view timeline in their session"
  ON timeline FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM experiment_session
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Policies for genie_interactions
CREATE POLICY "genie_select_own"
  ON genie_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "genie_insert_own"
  ON genie_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for eros_hints
CREATE POLICY "eros_hints_select"
  ON eros_hints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "eros_hints_insert"
  ON eros_hints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Tabela: bonus_wishes (concessao de desejos extras, 1x por usuario)
CREATE TABLE bonus_wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES experiment_session(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  etapa INT NOT NULL CHECK (etapa BETWEEN 1 AND 6),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE bonus_wishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on bonus_wishes"
  ON bonus_wishes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies for admin_context (only service_role can access)
CREATE POLICY "No direct access to admin_context"
  ON admin_context FOR ALL
  USING (false);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

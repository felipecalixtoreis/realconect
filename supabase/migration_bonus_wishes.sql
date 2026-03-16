-- Migration: Bonus Wishes System
-- Permite que o Eros conceda 3 desejos extras (uma única vez por usuário)

-- 1. Alterar constraint de interaction_number para permitir até 6
ALTER TABLE genie_interactions DROP CONSTRAINT genie_interactions_interaction_number_check;
ALTER TABLE genie_interactions ADD CONSTRAINT genie_interactions_interaction_number_check CHECK (interaction_number BETWEEN 1 AND 6);

-- 2. Criar tabela para rastrear concessão de desejos bônus
CREATE TABLE bonus_wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES experiment_session(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  etapa INT NOT NULL CHECK (etapa BETWEEN 1 AND 6),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)  -- apenas uma vez por usuário em todo o experimento
);

-- 3. RLS
ALTER TABLE bonus_wishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on bonus_wishes"
  ON bonus_wishes FOR ALL
  USING (true)
  WITH CHECK (true);

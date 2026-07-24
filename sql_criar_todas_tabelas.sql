-- ============================================================================
-- CRIA TODAS AS TABELAS FALTANTES + RECRIA A FUNÇÃO DE CONCLUSÃO
-- Execute no SQL Editor do Supabase
-- ============================================================================

-- 1. agendamento_produtos
CREATE TABLE IF NOT EXISTS agendamento_produtos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agendamento_id uuid NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES produtos(id),
  quantidade int NOT NULL DEFAULT 1,
  preco_unitario numeric NOT NULL,
  subtotal numeric GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agendamento_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa ve agendamento_produtos" ON agendamento_produtos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Empresa insere agendamento_produtos" ON agendamento_produtos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Empresa deleta agendamento_produtos" ON agendamento_produtos FOR DELETE
  USING (auth.role() = 'authenticated');

-- 2. transacoes_financeiras
CREATE TABLE IF NOT EXISTS transacoes_financeiras (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao text,
  valor numeric NOT NULL,
  metodo text,
  data_transacao timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa ve transacoes" ON transacoes_financeiras FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Empresa insere transacoes" ON transacoes_financeiras FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 3. comissoes
CREATE TABLE IF NOT EXISTS comissoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  funcionario_id uuid NOT NULL REFERENCES funcionarios(id),
  origem text NOT NULL DEFAULT 'agendamento',
  descricao text,
  valor_base numeric NOT NULL,
  percentual_aplicado numeric NOT NULL,
  valor_comissao numeric NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga')),
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa ve comissoes" ON comissoes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Empresa insere comissoes" ON comissoes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Empresa atualiza comissoes" ON comissoes FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 4. funcionario_bloqueios (para bloqueios de agenda)
CREATE TABLE IF NOT EXISTS funcionario_bloqueios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id uuid NOT NULL REFERENCES funcionarios(id),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  data_inicio timestamptz NOT NULL,
  data_fim timestamptz NOT NULL,
  motivo text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE funcionario_bloqueios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa ve bloqueios" ON funcionario_bloqueios FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Empresa insere bloqueios" ON funcionario_bloqueios FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 5. funcionario_horarios (se não existir)
CREATE TABLE IF NOT EXISTS funcionario_horarios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id uuid NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  dia_semana int NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL
);

ALTER TABLE funcionario_horarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa ve horarios" ON funcionario_horarios FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Empresa insere horarios" ON funcionario_horarios FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Empresa atualiza horarios" ON funcionario_horarios FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Empresa deleta horarios" ON funcionario_horarios FOR DELETE
  USING (auth.role() = 'authenticated');

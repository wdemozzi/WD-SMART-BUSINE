-- 1. Cria a tabela de produtos consumidos no atendimento
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

CREATE POLICY "Empresa ve agendamento_produtos" ON agendamento_produtos
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    agendamento_id IN (
      SELECT id FROM agendamentos WHERE empresa_id IN (
        SELECT empresa_id FROM perfis WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Empresa insere agendamento_produtos" ON agendamento_produtos
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    agendamento_id IN (
      SELECT id FROM agendamentos WHERE empresa_id IN (
        SELECT empresa_id FROM perfis WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Empresa deleta agendamento_produtos" ON agendamento_produtos
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    agendamento_id IN (
      SELECT id FROM agendamentos WHERE empresa_id IN (
        SELECT empresa_id FROM perfis WHERE id = auth.uid()
      )
    )
  );

-- ============================================================================
-- NOVA TABELA + RPC: Consumo interno de produtos por funcionários
-- Execute no SQL Editor do Supabase
-- ============================================================================

-- 1. Cria a tabela de consumo interno
CREATE TABLE IF NOT EXISTS consumo_interno (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  funcionario_id uuid NOT NULL REFERENCES funcionarios(id),
  produto_id uuid NOT NULL REFERENCES produtos(id),
  quantidade int NOT NULL DEFAULT 1,
  preco_unitario numeric NOT NULL,
  valor_total numeric GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'cobrado', 'descontado', 'cancelado')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES perfis(id)
);

-- 2. Habilita RLS
ALTER TABLE consumo_interno ENABLE ROW LEVEL SECURITY;

-- 3. Política: usuários autenticados da empresa podem ver/inserir
CREATE POLICY "Empresa ve consumo interno" ON consumo_interno
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid())
  );

CREATE POLICY "Empresa insere consumo interno" ON consumo_interno
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid())
  );

-- 4. RPC para registrar consumo interno com baixa de estoque
CREATE OR REPLACE FUNCTION registrar_consumo_interno(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_criado_por uuid,
  p_itens jsonb  -- [{"produto_id": "...", "quantidade": 2}, ...]
)
RETURNS TABLE(consumo_ids uuid[], mensagem_erro text)
LANGUAGE plpgsql
SET timezone = 'UTC'
AS $$
declare
  v_item record;
  v_produto record;
  v_ids uuid[] := '{}';
begin
  -- Valida cada item
  for v_item in select * from jsonb_to_recordset(p_itens) as x(produto_id uuid, quantidade int)
  loop
    -- Busca produto e confere estoque
    select preco_venda, quantidade_estoque, nome
    into v_produto
    from produtos
    where id = v_item.produto_id and empresa_id = p_empresa_id and ativo = true;

    if v_produto is null then
      mensagem_erro := 'Produto não encontrado ou inativo.';
      return next;
      return;
    end if;

    if v_produto.quantidade_estoque < v_item.quantidade then
      mensagem_erro := 'Estoque insuficiente para ' || v_produto.nome || '. Disponível: ' || v_produto.quantidade_estoque;
      return next;
      return;
    end if;

    -- Baixa o estoque
    update produtos
    set quantidade_estoque = quantidade_estoque - v_item.quantidade
    where id = v_item.produto_id;

    -- Registra o consumo
    with inserido as (
      insert into consumo_interno (empresa_id, funcionario_id, produto_id, quantidade, preco_unitario, criado_por)
      values (p_empresa_id, p_funcionario_id, v_item.produto_id, v_item.quantidade, v_produto.preco_venda, p_criado_por)
      returning id
    )
    select array_append(v_ids, id) into v_ids from inserido;
  end loop;

  consumo_ids := v_ids;
  return next;
end;
$$;

-- ============================================================================
-- CORREÇÃO: Função concluir_agendamento_com_pagamento com descrição detalhada
-- Em vez de "Agendamento #xxx", gera: "Corte de Cabelo (R$70,00) + Shampoo (R$35,00)"
-- Execute no SQL Editor do Supabase
-- ============================================================================

CREATE OR REPLACE FUNCTION concluir_agendamento_com_pagamento(
  p_agendamento_id uuid,
  p_metodo text
)
RETURNS void
LANGUAGE plpgsql
SET timezone = 'UTC'
AS $$
declare
  v_empresa_id uuid;
  v_cliente_id uuid;
  v_funcionario_id uuid;
  v_servico_nome text;
  v_servico_valor numeric;
  v_valor_desconto numeric;
  v_cupom_codigo text;
  v_duracao interval;
  v_produtos jsonb;
  v_item record;
  v_total_produtos numeric := 0;
  v_total numeric;
  v_descricao text;
  v_produtos_texto text := '';
begin
  -- Busca dados do agendamento
  select
    a.empresa_id,
    a.cliente_id,
    a.funcionario_id,
    s.nome,
    coalesce(a.valor, s.valor),
    coalesce(a.valor_desconto, 0),
    a.cupom_codigo,
    (a.data_hora_fim - a.data_hora_inicio)
  into
    v_empresa_id, v_cliente_id, v_funcionario_id,
    v_servico_nome, v_servico_valor, v_valor_desconto,
    v_cupom_codigo, v_duracao
  from agendamentos a
  join servicos s on s.id = a.servico_id
  where a.id = p_agendamento_id;

  -- Busca produtos consumidos no atendimento
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'nome', p.nome,
      'quantidade', ap.quantidade,
      'subtotal', ap.subtotal
    )
  ), '[]'::jsonb)
  into v_produtos
  from agendamento_produtos ap
  join produtos p on p.id = ap.produto_id
  where ap.agendamento_id = p_agendamento_id;

  -- Calcula total de produtos
  select coalesce(sum(subtotal), 0) into v_total_produtos
  from agendamento_produtos
  where agendamento_id = p_agendamento_id;

  -- Monta descrição detalhada
  v_descricao := v_servico_nome || ' (' || to_char(v_servico_valor, 'LFM999G990D00') || ')';

  for v_item in select * from jsonb_to_recordset(v_produtos) as x(nome text, quantidade int, subtotal numeric)
  loop
    v_produtos_texto := v_produtos_texto || ' + ' || v_item.quantidade || 'x ' || v_item.nome || ' (' || to_char(v_item.subtotal, 'LFM999G990D00') || ')';
  end loop;

  v_descricao := v_descricao || v_produtos_texto;

  if v_valor_desconto > 0 then
    v_descricao := v_descricao || ' - Desconto';
    if v_cupom_codigo is not null then
      v_descricao := v_descricao || ' (' || v_cupom_codigo || ')';
    end if;
    v_descricao := v_descricao || ' ' || to_char(v_valor_desconto, 'LFM999G990D00');
  end if;

  v_total := v_servico_valor + v_total_produtos - v_valor_desconto;

  -- Atualiza status do agendamento
  update agendamentos
  set status = 'concluido'
  where id = p_agendamento_id;

  -- Lança no fluxo de caixa com descrição detalhada (apenas se houver valor)
  if v_total > 0 then
    insert into transacoes_financeiras (empresa_id, tipo, descricao, valor, metodo, data_transacao)
    values (v_empresa_id, 'entrada', v_descricao, v_total, p_metodo, now());
  end if;

  -- Gera comissão para o funcionário (se houver)
  if v_funcionario_id is not null then
    insert into comissoes (empresa_id, funcionario_id, origem, descricao, valor_base, percentual_aplicado, valor_comissao, status, criado_em)
    select
      v_empresa_id,
      v_funcionario_id,
      'agendamento',
      v_descricao,
      v_servico_valor,
      coalesce(f.percentual_comissao, 0),
      round(v_servico_valor * coalesce(f.percentual_comissao, 0) / 100, 2),
      'pendente',
      now()
    from funcionarios f
    where f.id = v_funcionario_id and coalesce(f.percentual_comissao, 0) > 0;
  end if;
end;
$$;

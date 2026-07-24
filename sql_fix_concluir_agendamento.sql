CREATE OR REPLACE FUNCTION concluir_agendamento_com_pagamento(
  p_agendamento_id uuid,
  p_metodo text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_empresa_id uuid;
  v_cliente_id uuid;
  v_funcionario_id uuid;
  v_servico_nome text;
  v_servico_valor numeric;
  v_total numeric;
begin
  select a.empresa_id, a.cliente_id, a.funcionario_id, s.nome, coalesce(a.valor, s.valor)
  into v_empresa_id, v_cliente_id, v_funcionario_id, v_servico_nome, v_servico_valor
  from agendamentos a
  join servicos s on s.id = a.servico_id
  where a.id = p_agendamento_id;

  select coalesce(sum(subtotal), 0) into v_total
  from agendamento_produtos
  where agendamento_id = p_agendamento_id;

  v_total := v_servico_valor + v_total;

  update agendamentos set status = 'concluido' where id = p_agendamento_id;

  if v_total > 0 then
    insert into transacoes_financeiras (empresa_id, tipo, descricao, valor, metodo, data_transacao)
    values (v_empresa_id, 'entrada', v_servico_nome, v_total, p_metodo::metodo_pagamento, now());
  end if;

  if v_funcionario_id is not null then
    insert into comissoes (empresa_id, funcionario_id, origem, origem_id, descricao, valor_base, percentual_aplicado, valor_comissao, status, criado_em)
    select v_empresa_id, v_funcionario_id, 'agendamento', p_agendamento_id, v_servico_nome, v_servico_valor,
      coalesce(f.percentual_comissao, 0),
      round(v_servico_valor * coalesce(f.percentual_comissao, 0) / 100, 2),
      'pendente', now()
    from funcionarios f
    where f.id = v_funcionario_id and coalesce(f.percentual_comissao, 0) > 0;
  end if;
end;
$$;

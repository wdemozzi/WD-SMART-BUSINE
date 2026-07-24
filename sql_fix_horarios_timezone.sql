-- ============================================================================
-- CORREÇÃO: Função listar_horarios_disponiveis com timezone correto (America/Sao_Paulo)
-- Execute este SQL no SQL Editor do Supabase
-- ============================================================================

CREATE OR REPLACE FUNCTION listar_horarios_disponiveis(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_servico_id uuid,
  p_dia date
)
RETURNS TABLE(horario timestamptz)
LANGUAGE plpgsql
SET timezone = 'America/Sao_Paulo'  -- <-- ESSENCIAL: força o fuso do Brasil
AS $$
declare
  v_duracao int;
  v_dia_semana int;
  v_janela record;
  v_slot timestamptz;
  v_fim_slot timestamptz;
  v_ocupado boolean;
begin
  select duracao_minutos into v_duracao from servicos
    where id = p_servico_id and empresa_id = p_empresa_id and ativo = true;

  if v_duracao is null then
    return;
  end if;

  v_dia_semana := extract(dow from p_dia);

  for v_janela in
    select hora_inicio, hora_fim from funcionario_horarios
    where funcionario_id = p_funcionario_id and dia_semana = v_dia_semana
  loop
    -- Constrói o primeiro slot no timezone correto (America/Sao_Paulo)
    v_slot := (p_dia + v_janela.hora_inicio)::timestamptz;

    while v_slot + (v_duracao || ' minutes')::interval <= (p_dia + v_janela.hora_fim)::timestamptz loop
      v_fim_slot := v_slot + (v_duracao || ' minutes')::interval;

      -- Agora a comparação usa o mesmo timezone, então funciona corretamente
      if v_slot > now() then
        select exists(
          select 1 from funcionario_bloqueios
          where funcionario_id = p_funcionario_id
            and tstzrange(data_inicio, data_fim) && tstzrange(v_slot, v_fim_slot)
        ) into v_ocupado;

        if not v_ocupado then
          select exists(
            select 1 from agendamentos
            where funcionario_id = p_funcionario_id
              and status not in ('cancelado', 'nao_compareceu')
              and tstzrange(data_hora_inicio, data_hora_fim) && tstzrange(v_slot, v_fim_slot)
          ) into v_ocupado;
        end if;

        if not v_ocupado then
          horario := v_slot;
          return next;
        end if;
      end if;

      v_slot := v_slot + (v_duracao || ' minutes')::interval;
    end loop;
  end loop;
end;
$$;

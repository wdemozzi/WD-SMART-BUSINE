-- ============================================================================
-- CORREÇÃO FINAL: listar_horarios_disponiveis
-- Muda o critério do while: o INÍCIO do agendamento precisa estar DENTRO do
-- expediente. O atendimento pode terminar depois (v_slot <= v_fim_janela).
-- Isso garante que, com expediente até 18h e serviço de 60min, o slot das
-- 18h ainda apareça.
-- Usa AT TIME ZONE explícito para evitar ambiguidade de fuso horário.
-- ============================================================================

CREATE OR REPLACE FUNCTION listar_horarios_disponiveis(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_servico_id uuid,
  p_dia date
)
RETURNS TABLE(horario timestamptz)
LANGUAGE plpgsql
SET timezone = 'UTC'
AS $$
declare
  v_duracao int;
  v_dia_semana int;
  v_janela record;
  v_slot timestamptz;
  v_fim_slot timestamptz;
  v_inicio_janela timestamptz;
  v_fim_janela timestamptz;
  v_agora timestamptz;
  v_ocupado boolean;
begin
  select duracao_minutos into v_duracao from servicos
    where id = p_servico_id and empresa_id = p_empresa_id and ativo = true;

  if v_duracao is null then
    return;
  end if;

  v_dia_semana := extract(dow from p_dia);

  -- clock_timestamp(): horário real do sistema, não o do início da transação
  v_agora := clock_timestamp();

  for v_janela in
    select hora_inicio, hora_fim from funcionario_horarios
    where funcionario_id = p_funcionario_id and dia_semana = v_dia_semana
  loop
    -- Interpreta as horas como horário de Brasília e converte para UTC
    v_inicio_janela := (p_dia + v_janela.hora_inicio) AT TIME ZONE 'America/Sao_Paulo';
    v_fim_janela   := (p_dia + v_janela.hora_fim)   AT TIME ZONE 'America/Sao_Paulo';

    v_slot := v_inicio_janela;

    -- <= (e não <) para incluir o horário exato de fechamento (ex: 18h).
    -- O atendimento pode ultrapassar o fim do expediente; só o início importa.
    while v_slot <= v_fim_janela loop
      v_fim_slot := v_slot + (v_duracao || ' minutes')::interval;

      -- Remove horários que já passaram
      if v_slot > v_agora then

        select exists(
          select 1 from funcionario_bloqueios
          where funcionario_id = p_funcionario_id
            and tstzrange(data_inicio, data_fim, '[)') && tstzrange(v_slot, v_fim_slot, '[)')
        ) into v_ocupado;

        if not v_ocupado then
          select exists(
            select 1 from agendamentos
            where funcionario_id = p_funcionario_id
              and status not in ('cancelado', 'nao_compareceu')
              and tstzrange(data_hora_inicio, data_hora_fim, '[)') && tstzrange(v_slot, v_fim_slot, '[)')
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

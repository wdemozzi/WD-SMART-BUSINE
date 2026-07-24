-- ============================================================================
-- CORREÇÃO v2: Função listar_horarios_disponiveis
-- Usa AT TIME ZONE explícito em vez de depender do SET timezone
-- Corrige a defasagem de 1 hora e o cast de timestamptz
-- ============================================================================

CREATE OR REPLACE FUNCTION listar_horarios_disponiveis(
  p_empresa_id uuid,
  p_funcionario_id uuid,
  p_servico_id uuid,
  p_dia date
)
RETURNS TABLE(horario timestamptz)
LANGUAGE plpgsql
SET timezone = 'UTC'   -- mantemos UTC internamente; todas as conversões serão explícitas
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
  -- Busca a duração do serviço
  select duracao_minutos into v_duracao from servicos
    where id = p_servico_id and empresa_id = p_empresa_id and ativo = true;

  if v_duracao is null then
    return;
  end if;

  v_dia_semana := extract(dow from p_dia);

  -- Agora real (não o da transação), em UTC, para comparação precisa
  v_agora := clock_timestamp() AT TIME ZONE 'UTC';

  for v_janela in
    select hora_inicio, hora_fim from funcionario_horarios
    where funcionario_id = p_funcionario_id and dia_semana = v_dia_semana
  loop
    -- Converte data + hora manualmente para UTC, tratando o input como horário de Brasília
    -- Brasília = UTC-3, então adicionamos 3 horas para chegar em UTC
    v_inicio_janela := (p_dia + v_janela.hora_inicio) AT TIME ZONE 'America/Sao_Paulo';
    v_fim_janela   := (p_dia + v_janela.hora_fim)   AT TIME ZONE 'America/Sao_Paulo';

    v_slot := v_inicio_janela;

    while v_slot + (v_duracao || ' minutes')::interval <= v_fim_janela loop
      v_fim_slot := v_slot + (v_duracao || ' minutes')::interval;

      -- Só retorna horários que ainda não passaram
      if v_slot > v_agora then

        -- Verifica bloqueios do funcionário
        select exists(
          select 1 from funcionario_bloqueios
          where funcionario_id = p_funcionario_id
            and tstzrange(data_inicio, data_fim, '[)') && tstzrange(v_slot, v_fim_slot, '[)')
        ) into v_ocupado;

        -- Verifica conflitos com agendamentos existentes
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

-- ============================================================================
-- CORREÇÃO: Bloquear agendamento em horários passados
-- Execute este SQL no SQL Editor do Supabase
-- (https://supabase.com/dashboard/project/acqfdazycrksobtgsdlb/sql/new)
-- ============================================================================

-- O frontend já foi corrigido para filtrar horários passados,
-- mas este trigger cria uma camada extra de segurança no banco:
-- mesmo que alguém chame a API diretamente, o banco bloqueia.

-- 1. Função auxiliar chamada pelo trigger
CREATE OR REPLACE FUNCTION bloquear_agendamento_passado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_hora_inicio <= NOW() THEN
    RAISE EXCEPTION 'Não é possível criar um agendamento em um horário que já passou.'
      USING HINT = 'Escolha um horário futuro.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger que roda ANTES de qualquer INSERT ou UPDATE na tabela
DROP TRIGGER IF EXISTS trg_bloquear_agendamento_passado ON agendamentos;

CREATE TRIGGER trg_bloquear_agendamento_passado
  BEFORE INSERT OR UPDATE OF data_hora_inicio ON agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION bloquear_agendamento_passado();

-- Pronto! A partir de agora, qualquer tentativa de criar ou reagendar
-- para um horário passado será rejeitada pelo próprio banco de dados.

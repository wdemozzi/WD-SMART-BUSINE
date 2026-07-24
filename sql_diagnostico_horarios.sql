-- ============================================================================
-- DIAGNÓSTICO: Verificar horários de trabalho dos funcionários
-- Execute no SQL Editor do Supabase e veja os resultados
-- ============================================================================

-- 1. Liste os horários de trabalho de todos os funcionários da sua empresa
SELECT
  f.nome AS funcionario,
  fh.dia_semana,
  CASE fh.dia_semana
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Segunda'
    WHEN 2 THEN 'Terça'
    WHEN 3 THEN 'Quarta'
    WHEN 4 THEN 'Quinta'
    WHEN 5 THEN 'Sexta'
    WHEN 6 THEN 'Sábado'
  END AS dia,
  fh.hora_inicio,
  fh.hora_fim
FROM funcionario_horarios fh
JOIN funcionarios f ON f.id = fh.funcionario_id
WHERE f.empresa_id = (SELECT id FROM empresas LIMIT 1) -- ajuste se necessário
ORDER BY f.nome, fh.dia_semana;

-- 2. Verifique o código-fonte da função que gera os horários
-- (copie o resultado e me mostre para eu analisar)
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('listar_horarios_disponiveis', 'criar_agendamento_publico');

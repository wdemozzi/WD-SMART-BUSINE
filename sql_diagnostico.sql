-- Diagnóstico: verifica se a função existe e o erro real
SELECT proname, prokind, prosrc
FROM pg_proc
WHERE proname = 'concluir_agendamento_com_pagamento';

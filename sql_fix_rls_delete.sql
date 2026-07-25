-- Diagnóstico: verifica políticas RLS atuais nas tabelas principais
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('funcionarios', 'produtos', 'servicos', 'clientes', 'cupons')
ORDER BY tablename, cmd;

-- ═══════════════════════════════════════════════════════════════
-- Adiciona políticas de DELETE onde faltarem
-- ═══════════════════════════════════════════════════════════════

-- Funcionários: dono da empresa (admin) pode excluir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'funcionarios' AND policyname = 'Admin pode excluir funcionários'
  ) THEN
    CREATE POLICY "Admin pode excluir funcionários" ON public.funcionarios
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM perfis
          WHERE perfis.id = auth.uid()
            AND perfis.empresa_id = funcionarios.empresa_id
            AND perfis.role IN ('admin_empresa', 'super_admin')
        )
      );
  END IF;
END;
$$;

-- Produtos: dono da empresa pode excluir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'produtos' AND policyname = 'Admin pode excluir produtos'
  ) THEN
    CREATE POLICY "Admin pode excluir produtos" ON public.produtos
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM perfis
          WHERE perfis.id = auth.uid()
            AND perfis.empresa_id = produtos.empresa_id
            AND perfis.role IN ('admin_empresa', 'super_admin')
        )
      );
  END IF;
END;
$$;

-- Serviços: dono da empresa pode excluir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'servicos' AND policyname = 'Admin pode excluir serviços'
  ) THEN
    CREATE POLICY "Admin pode excluir serviços" ON public.servicos
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM perfis
          WHERE perfis.id = auth.uid()
            AND perfis.empresa_id = servicos.empresa_id
            AND perfis.role IN ('admin_empresa', 'super_admin')
        )
      );
  END IF;
END;
$$;

-- Clientes: dono da empresa pode excluir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clientes' AND policyname = 'Admin pode excluir clientes'
  ) THEN
    CREATE POLICY "Admin pode excluir clientes" ON public.clientes
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM perfis
          WHERE perfis.id = auth.uid()
            AND perfis.empresa_id = clientes.empresa_id
            AND perfis.role IN ('admin_empresa', 'super_admin')
        )
      );
  END IF;
END;
$$;

-- Cupons: dono da empresa pode excluir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cupons' AND policyname = 'Admin pode excluir cupons'
  ) THEN
    CREATE POLICY "Admin pode excluir cupons" ON public.cupons
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM perfis
          WHERE perfis.id = auth.uid()
            AND perfis.empresa_id = cupons.empresa_id
            AND perfis.role IN ('admin_empresa', 'super_admin')
        )
      );
  END IF;
END;
$$;

-- Confirma as políticas após a correção
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'DELETE'
  AND tablename IN ('funcionarios', 'produtos', 'servicos', 'clientes', 'cupons')
ORDER BY tablename;
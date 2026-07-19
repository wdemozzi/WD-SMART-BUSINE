import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Cliente, Servico, Funcionario } from '@/types/database'

export function useCadastrosAgenda(empresaId: string | undefined) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])

  useEffect(() => {
    if (!empresaId) return

    async function carregar() {
      const [{ data: c }, { data: s }, { data: f }] = await Promise.all([
        supabase.from('clientes').select('*').eq('empresa_id', empresaId!).order('nome'),
        supabase.from('servicos').select('*').eq('empresa_id', empresaId!).eq('ativo', true).order('nome'),
        supabase.from('funcionarios').select('*').eq('empresa_id', empresaId!).eq('ativo', true).order('nome'),
      ])
      setClientes((c ?? []) as Cliente[])
      setServicos((s ?? []) as Servico[])
      setFuncionarios((f ?? []) as Funcionario[])
    }

    carregar()
  }, [empresaId])

  return { clientes, servicos, funcionarios }
}

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Funcionario } from '@/types/database'

export interface FuncionarioFormValues {
  nome: string
  telefone: string
  email: string
  cargo: string
  ativo: boolean
  percentual_comissao: number | null
}

export function useFuncionarios(empresaId: string | undefined) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })

    if (error) setErro('Não foi possível carregar os funcionários.')
    else {
      setFuncionarios((data ?? []) as Funcionario[])
      setErro(null)
    }
    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(valores: FuncionarioFormValues) {
    const { error } = await supabase.from('funcionarios').insert({ empresa_id: empresaId, ...valores })
    if (!error) await carregar()
    return error
  }

  async function atualizar(id: string, valores: FuncionarioFormValues) {
    const { error } = await supabase.from('funcionarios').update(valores).eq('id', id)
    if (!error) await carregar()
    return error
  }

  async function excluir(id: string) {
    const { error } = await supabase.from('funcionarios').delete().eq('id', id)
    if (!error) await carregar()
    return error
  }

  return { funcionarios, carregando, erro, criar, atualizar, excluir }
}

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Cliente } from '@/types/database'

export interface ClienteFormValues {
  nome: string
  telefone: string
  whatsapp: string
  email: string
  cpf_cnpj: string
  cidade: string
  estado: string
  data_nascimento: string
  observacoes: string
}

export function useClientes(empresaId: string | undefined) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })

    if (error) {
      setErro('Não foi possível carregar os clientes.')
    } else {
      setClientes((data ?? []) as Cliente[])
      setErro(null)
    }
    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(valores: ClienteFormValues) {
    const { error } = await supabase.from('clientes').insert({ empresa_id: empresaId, ...valores })
    if (!error) await carregar()
    return error
  }

  async function atualizar(id: string, valores: ClienteFormValues) {
    const { error } = await supabase.from('clientes').update(valores).eq('id', id)
    if (!error) await carregar()
    return error
  }

  async function excluir(id: string) {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (!error) await carregar()
    return error
  }

  return { clientes, carregando, erro, recarregar: carregar, criar, atualizar, excluir }
}

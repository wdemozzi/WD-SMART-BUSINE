import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Servico } from '@/types/database'

export interface ServicoFormValues {
  nome: string
  descricao: string
  valor: number
  duracao_minutos: number
  categoria: string
  ativo: boolean
}

export function useServicos(empresaId: string | undefined) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })

    if (error) setErro('Não foi possível carregar os serviços.')
    else {
      setServicos((data ?? []) as Servico[])
      setErro(null)
    }
    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(valores: ServicoFormValues) {
    const { error } = await supabase.from('servicos').insert({ empresa_id: empresaId, ...valores })
    if (!error) await carregar()
    return error
  }

  async function atualizar(id: string, valores: ServicoFormValues) {
    const { error } = await supabase.from('servicos').update(valores).eq('id', id)
    if (!error) await carregar()
    return error
  }

  async function excluir(id: string) {
    const { error } = await supabase.from('servicos').delete().eq('id', id)
    if (!error) await carregar()
    return error
  }

  return { servicos, carregando, erro, criar, atualizar, excluir }
}

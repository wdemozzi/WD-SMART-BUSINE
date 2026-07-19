import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Produto } from '@/types/database'

export interface ProdutoFormValues {
  nome: string
  descricao: string
  categoria: string
  codigo_barras: string
  preco_custo: number
  preco_venda: number
  quantidade_estoque: number
  estoque_minimo: number
  ativo: boolean
}

export function useProdutos(empresaId: string | undefined) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true })

    if (error) setErro('Não foi possível carregar os produtos.')
    else {
      setProdutos((data ?? []) as Produto[])
      setErro(null)
    }
    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(valores: ProdutoFormValues) {
    const { error } = await supabase.from('produtos').insert({ empresa_id: empresaId, ...valores })
    if (!error) await carregar()
    return error
  }

  async function atualizar(id: string, valores: ProdutoFormValues) {
    const { error } = await supabase.from('produtos').update(valores).eq('id', id)
    if (!error) await carregar()
    return error
  }

  async function excluir(id: string) {
    const { error } = await supabase.from('produtos').delete().eq('id', id)
    if (!error) await carregar()
    return error
  }

  return { produtos, carregando, erro, criar, atualizar, excluir, recarregar: carregar }
}

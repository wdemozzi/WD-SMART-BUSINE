import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface ItemAgendamentoProduto {
  id: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  subtotal: number
  produto_nome?: string
}

export function useProdutosDoAgendamento(agendamentoId: string | undefined) {
  const [itens, setItens] = useState<ItemAgendamentoProduto[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!agendamentoId) return
    setCarregando(true)

    const { data } = await supabase
      .from('agendamento_produtos')
      .select('*, produtos(nome)')
      .eq('agendamento_id', agendamentoId)
      .order('criado_em')

    type LinhaBruta = ItemAgendamentoProduto & { produtos: { nome: string } | null }
    const linhas = (data ?? []) as unknown as LinhaBruta[]
    setItens(linhas.map((l) => ({ ...l, produto_nome: l.produtos?.nome })))
    setCarregando(false)
  }, [agendamentoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function adicionar(produtoId: string, quantidade: number) {
    const { data, error } = await supabase.rpc('adicionar_produto_agendamento', {
      p_agendamento_id: agendamentoId,
      p_produto_id: produtoId,
      p_quantidade: quantidade,
    })

    if (error || !data || data.length === 0) {
      return { sucesso: false, mensagem_erro: 'Não foi possível adicionar o produto.' }
    }

    const resultado = data[0] as { item_id: string | null; mensagem_erro: string | null }
    if (resultado.mensagem_erro) return { sucesso: false, mensagem_erro: resultado.mensagem_erro }

    await carregar()
    return { sucesso: true, mensagem_erro: null }
  }

  async function remover(itemId: string) {
    const { error } = await supabase.rpc('remover_produto_agendamento', { p_item_id: itemId })
    if (!error) await carregar()
    return error
  }

  const totalProdutos = itens.reduce((soma, i) => soma + Number(i.subtotal), 0)

  return { itens, totalProdutos, carregando, adicionar, remover, recarregar: carregar }
}

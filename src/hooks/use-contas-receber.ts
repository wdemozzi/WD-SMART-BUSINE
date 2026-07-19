import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ContaReceber, StatusPagamento } from '@/types/database'

export interface ContaReceberFormValues {
  descricao: string
  valor: number
  vencimento: string
  cliente_id: string | null
}

export function useContasReceber(empresaId: string | undefined) {
  const [contas, setContas] = useState<ContaReceber[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    const { data, error } = await supabase
      .from('contas_receber')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('vencimento', { ascending: true })

    if (error) setErro('Não foi possível carregar as contas a receber.')
    else {
      setContas((data ?? []) as ContaReceber[])
      setErro(null)
    }
    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(valores: ContaReceberFormValues) {
    const { error } = await supabase
      .from('contas_receber')
      .insert({ empresa_id: empresaId, status: 'pendente', ...valores })
    if (!error) await carregar()
    return error
  }

  async function excluir(id: string) {
    const { error } = await supabase.from('contas_receber').delete().eq('id', id)
    if (!error) await carregar()
    return error
  }

  // Dar baixa: marca como paga e lança a entrada correspondente no livro-caixa
  async function darBaixa(conta: ContaReceber, metodo: string) {
    const agora = new Date().toISOString()

    const { error: erroUpdate } = await supabase
      .from('contas_receber')
      .update({ status: 'pago' as StatusPagamento, metodo, pago_em: agora })
      .eq('id', conta.id)

    if (erroUpdate) return erroUpdate

    const { error: erroTransacao } = await supabase.from('transacoes_financeiras').insert({
      empresa_id: empresaId,
      tipo: 'entrada',
      origem: 'conta_receber',
      origem_id: conta.id,
      descricao: conta.descricao,
      valor: conta.valor,
      metodo,
      data_transacao: agora,
    })

    await carregar()
    return erroTransacao
  }

  return { contas, carregando, erro, criar, excluir, darBaixa }
}

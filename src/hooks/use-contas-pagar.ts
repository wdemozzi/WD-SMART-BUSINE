import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ContaPagar, StatusPagamento } from '@/types/database'

export interface ContaPagarFormValues {
  descricao: string
  categoria: string
  valor: number
  vencimento: string
}

export function useContasPagar(empresaId: string | undefined) {
  const [contas, setContas] = useState<ContaPagar[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    const { data, error } = await supabase
      .from('contas_pagar')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('vencimento', { ascending: true })

    if (error) setErro('Não foi possível carregar as contas a pagar.')
    else {
      setContas((data ?? []) as ContaPagar[])
      setErro(null)
    }
    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(valores: ContaPagarFormValues) {
    const { error } = await supabase
      .from('contas_pagar')
      .insert({ empresa_id: empresaId, status: 'pendente', ...valores })
    if (!error) await carregar()
    return error
  }

  async function excluir(id: string) {
    const { error } = await supabase.from('contas_pagar').delete().eq('id', id)
    if (!error) await carregar()
    return error
  }

  async function darBaixa(conta: ContaPagar) {
    const agora = new Date().toISOString()

    const { error: erroUpdate } = await supabase
      .from('contas_pagar')
      .update({ status: 'pago' as StatusPagamento, pago_em: agora })
      .eq('id', conta.id)

    if (erroUpdate) return erroUpdate

    const { error: erroTransacao } = await supabase.from('transacoes_financeiras').insert({
      empresa_id: empresaId,
      tipo: 'saida',
      origem: 'conta_pagar',
      origem_id: conta.id,
      descricao: conta.descricao,
      valor: conta.valor,
      data_transacao: agora,
    })

    await carregar()
    return erroTransacao
  }

  return { contas, carregando, erro, criar, excluir, darBaixa }
}

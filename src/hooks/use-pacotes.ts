import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Pacote, PacoteItem } from '@/types/database'

export interface PacoteFormValues {
  nome: string
  descricao: string
  valor_total: number
  validade_dias: number | null
  ativo: boolean
  itens: { servico_id: string; quantidade: number }[]
}

export function usePacotes(empresaId: string | undefined) {
  const [pacotes, setPacotes] = useState<Pacote[]>([])
  const [itensPorPacote, setItensPorPacote] = useState<Record<string, PacoteItem[]>>({})
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)

    const { data: pacotesData } = await supabase
      .from('pacotes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })

    const listaPacotes = (pacotesData ?? []) as Pacote[]
    setPacotes(listaPacotes)

    if (listaPacotes.length > 0) {
      const { data: itensData } = await supabase
        .from('pacote_itens')
        .select('*, servicos(nome)')
        .in('pacote_id', listaPacotes.map((p) => p.id))

      const mapa: Record<string, PacoteItem[]> = {}
      for (const item of (itensData ?? []) as unknown as (PacoteItem & { servicos: { nome: string } | null })[]) {
        const lista = mapa[item.pacote_id] ?? []
        lista.push({ ...item, servico_nome: item.servicos?.nome })
        mapa[item.pacote_id] = lista
      }
      setItensPorPacote(mapa)
    }

    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(valores: PacoteFormValues) {
    const { data, error } = await supabase
      .from('pacotes')
      .insert({
        empresa_id: empresaId,
        nome: valores.nome,
        descricao: valores.descricao,
        valor_total: valores.valor_total,
        validade_dias: valores.validade_dias,
        ativo: valores.ativo,
      })
      .select()
      .single()

    if (error || !data) return error

    const itensParaInserir = valores.itens
      .filter((i) => i.servico_id && i.quantidade > 0)
      .map((i) => ({ pacote_id: data.id, servico_id: i.servico_id, quantidade: i.quantidade }))

    if (itensParaInserir.length > 0) {
      const { error: erroItens } = await supabase.from('pacote_itens').insert(itensParaInserir)
      if (erroItens) return erroItens
    }

    await carregar()
    return null
  }

  async function alternarAtivo(pacote: Pacote) {
    const { error } = await supabase.from('pacotes').update({ ativo: !pacote.ativo }).eq('id', pacote.id)
    if (!error) await carregar()
    return error
  }

  async function excluir(id: string) {
    const { error } = await supabase.from('pacotes').delete().eq('id', id)
    if (!error) await carregar()
    return error
  }

  return { pacotes, itensPorPacote, carregando, criar, alternarAtivo, excluir, recarregar: carregar }
}

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ListaEspera } from '@/types/database'

export interface ListaEsperaFormValues {
  cliente_id: string
  servico_id: string
  funcionario_id: string | null
  data_desejada: string | null
  horario_desejado: string
  observacoes: string
}

export function useListaEspera(empresaId: string | undefined) {
  const [entradas, setEntradas] = useState<ListaEspera[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)

    const { data } = await supabase
      .from('lista_espera')
      .select('*, clientes(nome), servicos(nome), funcionarios(nome)')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: true })

    type LinhaBruta = ListaEspera & {
      clientes: { nome: string } | null
      servicos: { nome: string } | null
      funcionarios: { nome: string } | null
    }

    const linhas = (data ?? []) as unknown as LinhaBruta[]
    setEntradas(
      linhas.map((l) => ({
        ...l,
        cliente_nome: l.clientes?.nome,
        servico_nome: l.servicos?.nome,
        funcionario_nome: l.funcionarios?.nome ?? null,
      }))
    )
    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function adicionar(valores: ListaEsperaFormValues) {
    const { error } = await supabase.from('lista_espera').insert({ empresa_id: empresaId, ...valores })
    if (!error) await carregar()
    return error
  }

  async function atualizarStatus(id: string, status: ListaEspera['status']) {
    const { error } = await supabase.from('lista_espera').update({ status }).eq('id', id)
    if (!error) await carregar()
    return error
  }

  async function excluir(id: string) {
    const { error } = await supabase.from('lista_espera').delete().eq('id', id)
    if (!error) await carregar()
    return error
  }

  const aguardando = entradas.filter((e) => e.status === 'aguardando')
  const notificados = entradas.filter((e) => e.status === 'notificado')

  return { entradas, aguardando, notificados, carregando, adicionar, atualizarStatus, excluir, recarregar: carregar }
}

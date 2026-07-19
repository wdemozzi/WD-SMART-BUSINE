import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FidelidadeConfig, FidelidadeRecompensa } from '@/types/database'

export function useFidelidadeConfig(empresaId: string | undefined) {
  const [config, setConfig] = useState<FidelidadeConfig | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    const { data } = await supabase.from('fidelidade_config').select('*').eq('empresa_id', empresaId).maybeSingle()

    setConfig(
      (data as FidelidadeConfig | null) ?? {
        empresa_id: empresaId,
        ativo: false,
        pontos_por_real: 1,
        descricao: '',
      }
    )
    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function salvar(valores: Omit<FidelidadeConfig, 'empresa_id'>) {
    const { error } = await supabase
      .from('fidelidade_config')
      .upsert({ empresa_id: empresaId, ...valores, atualizado_em: new Date().toISOString() })
    if (!error) await carregar()
    return error
  }

  return { config, carregando, salvar }
}

export interface RecompensaFormValues {
  nome: string
  pontos_necessarios: number
  ativo: boolean
}

export function useFidelidadeRecompensas(empresaId: string | undefined) {
  const [recompensas, setRecompensas] = useState<FidelidadeRecompensa[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    const { data } = await supabase
      .from('fidelidade_recompensas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('pontos_necessarios', { ascending: true })

    setRecompensas((data ?? []) as FidelidadeRecompensa[])
    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(valores: RecompensaFormValues) {
    const { error } = await supabase.from('fidelidade_recompensas').insert({ empresa_id: empresaId, ...valores })
    if (!error) await carregar()
    return error
  }

  async function excluir(id: string) {
    const { error } = await supabase.from('fidelidade_recompensas').delete().eq('id', id)
    if (!error) await carregar()
    return error
  }

  return { recompensas, carregando, criar, excluir, recarregar: carregar }
}

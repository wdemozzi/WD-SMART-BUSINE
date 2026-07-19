import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface RecorrenciaCliente {
  cliente_id: string
  empresa_id: string
  nome: string
  whatsapp: string | null
  cliente_desde: string
  ultima_visita: string | null
  dias_sem_aparecer: number | null
  total_atendimentos: number
}

const LIMIAR_INATIVO_DIAS = 30

export function useRecorrenciaClientes(empresaId: string | undefined) {
  const [clientes, setClientes] = useState<RecorrenciaCliente[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)

    const { data } = await supabase
      .from('vw_recorrencia_clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('dias_sem_aparecer', { ascending: false, nullsFirst: false })

    setClientes((data ?? []) as RecorrenciaCliente[])
    setCarregando(false)
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const inativos = clientes.filter(
    (c) => c.dias_sem_aparecer != null && c.dias_sem_aparecer >= LIMIAR_INATIVO_DIAS
  )
  const semHistorico = clientes.filter((c) => c.ultima_visita == null && c.total_atendimentos === 0)

  return { clientes, inativos, semHistorico, carregando, recarregar: carregar, LIMIAR_INATIVO_DIAS }
}

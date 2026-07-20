import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface OcorrenciaCliente {
  cliente_id: string
  empresa_id: string
  nome: string
  whatsapp: string | null
  total_faltas: number
  total_cancelamentos: number
  cancelamentos_ultima_hora: number
  total_reagendamentos: number
  ultima_ocorrencia_em: string | null
}

export function useOcorrenciasClientes(empresaId: string | undefined) {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaCliente[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!empresaId) return

    supabase
      .from('vw_ocorrencias_clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('total_faltas', { ascending: false })
      .then(({ data }) => {
        setOcorrencias((data ?? []) as OcorrenciaCliente[])
        setCarregando(false)
      })
  }, [empresaId])

  return { ocorrencias, carregando }
}

// Busca a ocorrência de UM cliente específico — usada para mostrar o alerta
// discreto no momento de criar um novo agendamento.
export async function buscarOcorrenciaCliente(clienteId: string) {
  const { data } = await supabase.from('vw_ocorrencias_clientes').select('*').eq('cliente_id', clienteId).maybeSingle()

  return (data as OcorrenciaCliente | null) ?? null
}
